import unittest
from sdk_conformance import run
class SDKTests(unittest.TestCase):
    def test_shared_contract(self):
        self.assertEqual(len(run()['cases']),45)
