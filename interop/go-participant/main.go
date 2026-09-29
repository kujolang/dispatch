// Independent portable-json and handoff codec. Standard library only.
package main

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode/utf8"
)

func need(ok bool) {
	if !ok {
		panic("invalid_protocol")
	}
}

var key = regexp.MustCompile(`^[A-Za-z0-9_.:-]{1,128}$`)
var identifier = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$`)
var reference = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)
var attempt = regexp.MustCompile(`^[1-9][0-9]*$`)

func obj(v any) map[string]any { m, ok := v.(map[string]any); need(ok); return m }
func str(v any) string         { s, ok := v.(string); need(ok); return s }
func closed(v any, names ...string) map[string]any {
	m := obj(v)
	need(len(m) == len(names))
	for _, n := range names {
		_, ok := m[n]
		need(ok)
	}
	return m
}
func quote(s string) string {
	need(utf8.ValidString(s))
	var b strings.Builder
	b.WriteByte('"')
	for _, r := range s {
		switch r {
		case '"':
			b.WriteString(`\"`)
		case '\\':
			b.WriteString(`\\`)
		case '\b':
			b.WriteString(`\b`)
		case '\f':
			b.WriteString(`\f`)
		case '\n':
			b.WriteString(`\n`)
		case '\r':
			b.WriteString(`\r`)
		case '\t':
			b.WriteString(`\t`)
		default:
			if r < 32 {
				fmt.Fprintf(&b, `\u%04x`, r)
			} else {
				b.WriteRune(r)
			}
		}
	}
	b.WriteByte('"')
	return b.String()
}
func encode(v any, depth int) string {
	need(depth <= 8)
	switch x := v.(type) {
	case nil:
		return "null"
	case string:
		return quote(x)
	case bool:
		if x {
			return "true"
		}
		return "false"
	case json.Number:
		n, err := strconv.ParseInt(string(x), 10, 64)
		need(err == nil && n >= -9007199254740991 && n <= 9007199254740991 && string(x) != "-0")
		return strconv.FormatInt(n, 10)
	case []any:
		need(len(x) <= 64)
		parts := []string{}
		for _, v := range x {
			parts = append(parts, encode(v, depth+1))
		}
		return "[" + strings.Join(parts, ",") + "]"
	case map[string]any:
		need(len(x) <= 64)
		names := []string{}
		for k := range x {
			need(key.MatchString(k))
			names = append(names, k)
		}
		sort.Strings(names)
		parts := []string{}
		for _, k := range names {
			parts = append(parts, quote(k)+":"+encode(x[k], depth+1))
		}
		return "{" + strings.Join(parts, ",") + "}"
	}
	panic("invalid_protocol")
}
func canonical(v any) string { s := encode(v, 0); need(len(s) <= 8192); return s }
func strictEscapes(raw []byte) {
	for i := 0; i < len(raw); i++ {
		if raw[i] != '\\' {
			continue
		}
		i++
		need(i < len(raw))
		if raw[i] != 'u' {
			continue
		}
		need(i+4 < len(raw))
		n, e := strconv.ParseUint(string(raw[i+1:i+5]), 16, 16)
		need(e == nil)
		i += 4
		if n >= 0xd800 && n <= 0xdbff {
			need(i+6 < len(raw) && raw[i+1] == '\\' && raw[i+2] == 'u')
			low, e := strconv.ParseUint(string(raw[i+3:i+7]), 16, 16)
			need(e == nil && low >= 0xdc00 && low <= 0xdfff)
			i += 6
		} else {
			need(n < 0xdc00 || n > 0xdfff)
		}
	}
}

// Token decoding rejects duplicate keys before information can be lost in a map.
func tree(d *json.Decoder, depth int) any {
	need(depth <= 16)
	token, e := d.Token()
	need(e == nil)
	delim, ok := token.(json.Delim)
	if !ok {
		return token
	}
	switch delim {
	case '{':
		m := map[string]any{}
		for d.More() {
			k, e := d.Token()
			need(e == nil)
			name := str(k)
			_, exists := m[name]
			need(!exists)
			m[name] = tree(d, depth+1)
		}
		end, e := d.Token()
		need(e == nil && end == json.Delim('}'))
		return m
	case '[':
		a := []any{}
		for d.More() {
			a = append(a, tree(d, depth+1))
		}
		end, e := d.Token()
		need(e == nil && end == json.Delim(']'))
		return a
	}
	panic("invalid_protocol")
}
func decode(raw []byte) any {
	need(len(raw) <= 8192)
	return decodeRPC(raw)
}
func handoff(raw []byte) map[string]any {
	need(len(raw) <= 6144)
	v := decode(raw)
	need(canonical(v) == string(raw))
	m := closed(v, "schema", "subject", "participant", "completion_knowledge", "execution_result_ref", "assurance_ref", "participant_extension", "effect_extension")
	need(m["schema"] == "kujo.interop-handoff/v1alpha1")
	s := closed(m["subject"], "run_id", "step_id", "attempt_id", "effect_id")
	for _, v := range s {
		need(identifier.MatchString(str(v)))
	}
	need(attempt.MatchString(str(s["attempt_id"])))
	p := closed(m["participant"], "namespace", "invocation_id")
	for _, v := range p {
		need(identifier.MatchString(str(v)))
	}
	need(p["namespace"] == "kujolang.go-process")
	need(m["completion_knowledge"] == "reported" || m["completion_knowledge"] == "unknown")
	need(reference.MatchString(str(m["execution_result_ref"])))
	if m["assurance_ref"] != nil {
		need(reference.MatchString(str(m["assurance_ref"])))
	}
	ext := closed(m["participant_extension"], "schema", "values")
	need(ext["schema"] == "kujolang.go-process-correlation/v1alpha1")
	values := closed(ext["values"], "call_id", "process_instance_id")
	for _, v := range values {
		need(identifier.MatchString(str(v)))
	}
	if m["effect_extension"] != nil {
		e := closed(m["effect_extension"], "schema", "values")
		need(e["schema"] == "workcell.git-correlation/v1alpha1")
		v := closed(e["values"], "workcell_effect_id", "transaction_sha256")
		need(identifier.MatchString(str(v["workcell_effect_id"])))
		need(regexp.MustCompile(`^[0-9a-f]{64}$`).MatchString(str(v["transaction_sha256"])))
	}
	core := map[string]any{}
	for k, v := range m {
		if k != "participant_extension" && k != "effect_extension" {
			core[k] = v
		}
	}
	need(len(canonical(core)) <= 2048)
	return m
}
func operation(mode string, raw []byte) string {
	switch mode {
	case "encode":
		return canonical(decode(raw))
	case "canonical":
		v := decode(raw)
		s := canonical(v)
		need(s == string(raw))
		return s
	case "parse", "record":
		return canonical(handoff(raw))
	case "hash":
		need(len(raw) <= 8192)
		h := sha256.Sum256(raw)
		return "sha256:" + hex.EncodeToString(h[:])
	case "match":
		m := closed(decodeRPC(raw), "wire_hex", "expected")
		b, e := hex.DecodeString(str(m["wire_hex"]))
		need(e == nil)
		v := handoff(b)
		expected := handoff([]byte(canonical(m["expected"])))
		need(canonical(v) == canonical(expected))
		return canonical(v)
	}
	panic("invalid_protocol")
}
func safe(mode string, raw []byte) (out string, ok bool) {
	defer func() {
		if recover() != nil {
			out = "invalid_protocol"
			ok = false
		}
	}()
	return operation(mode, raw), true
}
func main() {
	if len(os.Args) != 2 {
		os.Exit(2)
	}
	if os.Args[1] == "mcp" {
		serveMCP()
		return
	}
	raw, e := io.ReadAll(io.LimitReader(os.Stdin, 32769))
	if e != nil {
		os.Exit(2)
	}
	out, ok := safe(os.Args[1], raw)
	if !ok {
		fmt.Fprintln(os.Stderr, "invalid_protocol")
		os.Exit(1)
	}
	fmt.Print(out)
}

// Local recording-only MCP surface. No execution, evidence lookup or admission.
func serveMCP() {
	s := bufio.NewScanner(os.Stdin)
	s.Buffer(make([]byte, 4096), 32768)
	ready := false
	initialized := false
	for s.Scan() {
		func() {
			defer func() {
				if recover() != nil {
					fmt.Println(`{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"Invalid request"}}`)
				}
			}()
			q := obj(decodeRPC(s.Bytes()))
			id, hasID := q["id"]
			method := str(q["method"])
			need(q["jsonrpc"] == "2.0")
			if method == "notifications/initialized" && !hasID {
				need(initialized && !ready)
				ready = true
				return
			}
			if !hasID {
				return
			}
			reply := map[string]any{"jsonrpc": "2.0", "id": id}
			var result any
			switch method {
			case "initialize":
				need(!initialized)
				params := obj(q["params"])
				need(str(params["protocolVersion"]) != "")
				obj(params["capabilities"])
				info := obj(params["clientInfo"])
				str(info["name"])
				str(info["version"])
				initialized = true
				result = map[string]any{"protocolVersion": "2024-11-05", "capabilities": map[string]any{"tools": map[string]any{}}, "serverInfo": map[string]any{"name": "kujo-recording-proof", "version": "0.0.0"}}
			case "tools/list":
				need(ready)
				result = map[string]any{"tools": []any{map[string]any{"name": "record_handoff", "description": "Validate and record participant knowledge; grants no authority.", "inputSchema": map[string]any{"type": "object", "properties": map[string]any{"wire": map[string]any{"type": "string"}}, "required": []any{"wire"}, "additionalProperties": false}}}}
			case "tools/call":
				need(ready)
				p := closed(q["params"], "name", "arguments")
				need(p["name"] == "record_handoff")
				a := closed(p["arguments"], "wire")
				out, ok := safe("record", []byte(str(a["wire"])))
				result = map[string]any{"content": []any{map[string]any{"type": "text", "text": out}}, "isError": !ok}
			default:
				reply["error"] = map[string]any{"code": -32601, "message": "Method not found"}
			}
			if result != nil {
				reply["result"] = result
			}
			b, e := json.Marshal(reply)
			need(e == nil)
			fmt.Println(string(b))
		}()
	}
	if s.Err() != nil {
		os.Exit(1)
	}
}
func decodeRPC(b []byte) any {
	need(len(b) <= 32768 && utf8.Valid(b))
	strictEscapes(b)
	d := json.NewDecoder(bytes.NewReader(b))
	d.UseNumber()
	v := tree(d, 0)
	_, e := d.Token()
	need(e == io.EOF)
	return v
}
