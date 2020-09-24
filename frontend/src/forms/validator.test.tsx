import {
  ValidatorArrayNotEmpty,
  ValidatorArrayOfDIsWildcardDNS1123SubDomain,
  ValidatorArrayOfIsDNS1123SubDomain,
  ValidatorContainerPortRequired,
  ValidatorIsDNS1123SubDomain,
  ValidatorIsDNS123Label,
  ValidatorIsEnvVarName,
  ValidatorIsWildcardDNS1123SubDomain,
} from "forms/validator";

test("ValidatorIsEnvVarName", () => {
  const goodValues = ["my.env-name", "MY_ENV.NAME", "MyEnvName1"];

  for (let val of goodValues) {
    expect(ValidatorIsEnvVarName(val)).toBeUndefined();
  }
});

test("ValidatorContainerPortRequired", () => {
  const testCases = [
    [443, "Can't use 443 port"],
    [8080, undefined],
  ];

  testCases.forEach((testCase) => {
    expect(ValidatorContainerPortRequired(testCase[0])).toEqual(testCase[1]);
  });
});

test("ValidatorApplicationName", () => {
  const testCases = [
    ["", "Required"],
    ["n".repeat(100), "Max length is 63"],
    ["&^#$", "Not a valid DNS1123 label. Regex is /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/"],
  ];

  testCases.forEach((testCase) => {
    expect(ValidatorIsDNS123Label(testCase[0])).toEqual(testCase[1]);
  });

  const badCases = [
    "",
    "A",
    "ABC",
    "aBc",
    "A1",
    "A-1",
    "1-A",
    "-",
    "a-",
    "-a",
    "1-",
    "-1",
    "_",
    "a_",
    "_a",
    "a_b",
    "1_",
    "_1",
    "1_2",
    ".",
    "a.",
    ".a",
    "a.b",
    "1.",
    ".1",
    "1.2",
    " ",
    "a ",
    " a",
    "a b",
    "1 ",
    " 1",
    "1 2",
  ];

  badCases.forEach((testCase) => {
    expect(ValidatorIsDNS123Label(testCase)).toEqual(expect.anything());
  });

  // good Cases
  const goodCases = ["a", "ab", "abc", "a1", "a-1", "a--1--2--b", "0", "01", "012", "1a", "1-a", "1--a--b--2"];
  goodCases.forEach((testCase) => {
    expect(ValidatorIsDNS123Label(testCase)).toEqual(undefined);
  });
});

test("DNS1123SubDomain", () => {
  const goodValues = [
    "a",
    "ab",
    "abc",
    "a1",
    "a-1",
    "a--1--2--b",
    "0",
    "01",
    "012",
    "1a",
    "1-a",
    "1--a--b--2",
    "a.a",
    "ab.a",
    "abc.a",
    "a1.a",
    "a-1.a",
    "a--1--2--b.a",
    "a.1",
    "ab.1",
    "abc.1",
    "a1.1",
    "a-1.1",
    "a--1--2--b.1",
    "0.a",
    "01.a",
    "012.a",
    "1a.a",
    "1-a.a",
    "1--a--b--2",
    "0.1",
    "01.1",
    "012.1",
    "1a.1",
    "1-a.1",
    "1--a--b--2.1",
    "a.b.c.d.e",
    "aa.bb.cc.dd.ee",
    "1.2.3.4.5",
    "11.22.33.44.55",
    "a".repeat(253),
  ];

  for (let val of goodValues) {
    expect(ValidatorIsDNS1123SubDomain(val)).toBeUndefined();
  }

  const badValues = [
    "",
    "A",
    "ABC",
    "aBc",
    "A1",
    "A-1",
    "1-A",
    "-",
    "a-",
    "-a",
    "1-",
    "-1",
    "_",
    "a_",
    "_a",
    "a_b",
    "1_",
    "_1",
    "1_2",
    ".",
    "a.",
    ".a",
    "a..b",
    "1.",
    ".1",
    "1..2",
    " ",
    "a ",
    " a",
    "a b",
    "1 ",
    " 1",
    "1 2",
    "A.a",
    "aB.a",
    "ab.A",
    "A1.a",
    "a1.A",
    "A.1",
    "aB.1",
    "A1.1",
    "1A.1",
    "0.A",
    "01.A",
    "012.A",
    "1A.a",
    "1a.A",
    "A.B.C.D.E",
    "AA.BB.CC.DD.EE",
    "a.B.c.d.e",
    "aa.bB.cc.dd.ee",
    "a@b",
    "a,b",
    "a_b",
    "a;b",
    "a:b",
    "a%b",
    "a?b",
    "a$b",
    "a".repeat(254),
  ];

  for (let val of badValues) {
    expect(ValidatorIsDNS1123SubDomain(val)).not.toBeUndefined();
  }
});

test("ValidatorArrayOfDNS1123SubDomain", () => {
  expect(ValidatorArrayOfIsDNS1123SubDomain([])).not.toBeUndefined();
  expect(ValidatorArrayOfIsDNS1123SubDomain(["1--a--b--2.1", "_1"])).toEqual([
    undefined,
    "Not a valid DNS123 SubDomain",
  ]);
});

test("ValidatorIsWildcardDNS1123SubDomain", () => {
  const goodValues = ["*.example.com", "*.bar.com", "*.foo.bar.com"];

  for (let val of goodValues) {
    expect(ValidatorIsWildcardDNS1123SubDomain(val)).toBeUndefined();
  }

  const badValues = ["*.*.bar.com", "*.foo.*.com", "*bar.com", "f*.bar.com", "*"];

  for (let val of badValues) {
    expect(ValidatorIsWildcardDNS1123SubDomain(val)).not.toBeUndefined();
  }
});

test("ValidatorArrayOfDIsWildcardDNS1123SubDomain", () => {
  expect(ValidatorArrayOfDIsWildcardDNS1123SubDomain([])).not.toBeUndefined();
  expect(ValidatorArrayOfDIsWildcardDNS1123SubDomain(["*.example.com", "*.bar.com", "*.foo.bar.com"])).toBeUndefined();
  expect(
    ValidatorArrayOfDIsWildcardDNS1123SubDomain(["*.*.bar.com", "*.foo.*.com", "*bar.com", "f*.bar.com", "*"]),
  ).toEqual([
    "Not a valid wildcard DNS123 SubDomain",
    "Not a valid wildcard DNS123 SubDomain",
    "Not a valid wildcard DNS123 SubDomain",
    "Not a valid wildcard DNS123 SubDomain",
    "Not a valid wildcard DNS123 SubDomain",
  ]);
});

test("ValidatorArrayNotEmpty", () => {
  expect(ValidatorArrayNotEmpty([])).toEqual("Should have at least one item");

  expect(ValidatorArrayNotEmpty(["a"])).toBeUndefined();
});
