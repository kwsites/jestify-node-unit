
export const TEST_LIFECYCLE_BEFORE = 'setUp';
export const TEST_LIFECYCLE_AFTER = 'tearDown';

export interface NodeUnitDoneMethod {
    (): void;
}

export interface NodeUnitLifecycleMethod {
    (done: NodeUnitDoneMethod): void;
}

export interface NodeUnitTestData {
    done: NodeUnitDoneMethod;
    deepEqual<T> (actual: T, expected: T): void;
    equal<T> (actual: T, expected: T): void;
    equals<T> (actual: T, expected: T): void;
    notEqual<T> (actual: T, expected: T): void;
    ok<T> (actual: T): void;
    same<T> (actual: T, expected: T): void;
    doesNotThrow (thrower: () => any): void;
    throws (thrower: () => any): void;
}

export interface NodeUnitTest {
    (test: NodeUnitTestData): void;
}

export interface NodeUnitSuite {
    setUp?: NodeUnitLifecycleMethod;
    tearDown?: NodeUnitLifecycleMethod;

    [test: string]: NodeUnitTest | NodeUnitLifecycleMethod | undefined;
}

export interface NodeUnitSpec {
    setUp?: NodeUnitLifecycleMethod;
    tearDown?: NodeUnitLifecycleMethod;

    [test: string]: NodeUnitSuite | NodeUnitLifecycleMethod | undefined;
}

export function jestify(spec: NodeUnitSpec) {

    addLifecycleHandlers(spec.setUp, spec.tearDown);

    nonLifeCycleMethods<NodeUnitSuite>(spec).forEach(([name, suite]) => {

        describe(name, () => {

            addLifecycleHandlers(suite.setUp, suite.tearDown);

            nonLifeCycleMethods<NodeUnitTest>(suite).forEach(([testName, executor]) => {
                addTestMethod(testName, executor);
            });

        });
    });
}

function addTestMethod (testName: string, testExecutor: NodeUnitTest) {

    const jestTestName = testName.replace(/^x/, '');
    const jestTestType = testName === jestTestName ? it : xit;

    jestTestType(jestTestName, () => new Promise(done => {
        testExecutor(test(() => {
            Promise.resolve().then(() => done());
        }));
    }));
}

function addLifecycleHandlers(setUp?: NodeUnitLifecycleMethod, tearDown?: NodeUnitLifecycleMethod) {
    if (isLifecycleMethod(setUp, TEST_LIFECYCLE_BEFORE)) {
        beforeEach(() => new Promise(done => setUp(done)));
    }

    if (isLifecycleMethod(tearDown, TEST_LIFECYCLE_AFTER)) {
        afterEach(() => new Promise(done => tearDown(done)));
    }
}

function nonLifeCycleMethods<RETURN = NodeUnitSuite | NodeUnitTest>(container: { [key: string]: RETURN | NodeUnitLifecycleMethod | undefined }): Array<[string, RETURN]> {

    return Object.keys(container).reduce((all, name) => {

        const value: RETURN | NodeUnitLifecycleMethod | undefined = container[name];

        if (isLifecycleMethod(value, name)) {
            return all;
        }

        if (value) {
            all.push([name, value]);
        }

        return all;

    }, [] as Array<[string, RETURN]>);

}

function isLifecycleMethod(test: any, name?: string): test is NodeUnitLifecycleMethod {
    return (name === TEST_LIFECYCLE_BEFORE || name === TEST_LIFECYCLE_AFTER) && isNodeUnitFunction(test);
}

function isNodeUnitFunction (test: any): boolean {
    return typeof test === 'function' && test.length === 1;
}

function test (done: NodeUnitDoneMethod): NodeUnitTestData {
    return {
        done,
        deepEqual (actual, expected) {
            expect(actual).toEqual(expected);
        },
        equal (actual, expected) {
            expect(actual).toEqual(expected);
        },
        equals (actual, expected) {
            expect(actual).toBe(expected);
        },
        notEqual (actual, expected) {
            expect(actual).not.toEqual(expected);
        },
        ok (actual) {
            expect(actual).toBeTruthy();
        },
        same (actual, expected) {
            expect(actual).toEqual(expected);
        },
        doesNotThrow (thrower) {
            expect(thrower).not.toThrow();
        },
        throws (thrower) {
            expect(thrower).toThrow();
        },
    }
}
