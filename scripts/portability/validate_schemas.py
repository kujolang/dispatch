"""Supplementary full JSON Schema validation; runtime admission does not use this.
Requires python-jsonschema. Independent portable checkers remain stdlib-only.
"""
import json,copy
from pathlib import Path
from jsonschema import Draft202012Validator

def load(path):return json.loads(Path(path).read_text())
def check(schema,value):
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema).validate(value)
count=0
profiles={'dispatch.sqlite-unique':'docs/contracts','workcell.git-cas':'../workcell/docs/contracts','ability.application-gateway':'../ability/docs/contracts'}
for a in load('tests/vectors/assurance-artifacts.json'):
    result=load('../kujo/schemas/workflow-control/execution-result-v1.schema.json')
    check(result,json.loads(a['result_raw']))
    doc=json.loads(a['assurance_raw']);beta=doc['schema'].endswith('v1beta1')
    schema=load('schemas/effect-assurance-v1'+('beta1' if beta else 'alpha1')+'.schema.json');check(schema,doc)
    if beta:
        check(load(profiles[doc['profile']['id']]+'/bindings-v1beta1.schema.json'),doc['bindings'])
        bad=copy.deepcopy(doc);bad['issuer']='valid-prefix\n'
        assert not Draft202012Validator(schema).is_valid(bad)
    count+=1
for v in load('tests/vectors/commitments.json')['vectors']:
    if v['name']=='configuration-beta1':
        schema=load('schemas/assurance-configuration-v1beta1.schema.json');check(schema,v['input'])
        bad=copy.deepcopy(v['input']);bad['issuer']='valid-prefix\n';assert not Draft202012Validator(schema).is_valid(bad)
    if v['name']=='policy-beta1':
        value={**v['input'],'policy_sha256':v['sha256']};check(load('schemas/assurance-negotiation-v1beta1.schema.json'),value)
print(json.dumps({'draft202012_artifacts':count,'beta_configuration_policy':True,'newline_identifiers_rejected':True,'ok':True}))
