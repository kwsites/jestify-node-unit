import { jestify, NodeUnitSpec, NodeUnitTestData } from '../lib/jestify-node-unit';

describe('jestification', () => {

    let lifecycleOrder: any[];
    let spies: {
        afterEach: any,
        beforeEach: any,
        describe: any,
        it: any,
        xit: any,
    };

    const asyncLifecycleCalled = (name: string, done: any) => {
        lifecycleOrder.push({name, action: 'called'});
        Promise.resolve().then(() => {
            lifecycleOrder.push({name, action: 'resolved'});
            done();
        });
    };

    const resetSpies = (which = Object.values(spies)) => {
        which.forEach(spy => spy.mockReset());
    };

    beforeEach(() => {
        lifecycleOrder = [];
        spies = {
            afterEach: (jest.spyOn as any)(global, 'afterEach').mockImplementation(() => {}),
            beforeEach: (jest.spyOn as any)(global, 'beforeEach').mockImplementation(() => {}),
            describe: (jest.spyOn as any)(global, 'describe').mockImplementation(() => {}),
            it: (jest.spyOn as any)(global, 'it').mockImplementation(() => {}),
            xit: (jest.spyOn as any)(global, 'xit').mockImplementation(() => {}),
        };
    });

    it('Creates a described spec', () => {
        const spec: NodeUnitSpec = {
            setUp(done) {
                asyncLifecycleCalled('spec-setUp', done);
            },

            'named suite': {

                setUp(done) {
                    asyncLifecycleCalled('suite-setUp', done);
                },

                'first'(test: NodeUnitTestData) {
                    asyncLifecycleCalled('first', test.done);
                },

                'second' (test: NodeUnitTestData) {
                    asyncLifecycleCalled('second', test.done);
                }

            },
        };

        jestify(spec);
        const nodeUnitDescribe = spies.describe.mock.calls[0][1];

        expect(spies.beforeEach).toHaveBeenCalledTimes(1);
        expect(spies.describe).toHaveBeenCalledTimes(1);
        expect(spies.describe).toHaveBeenCalledWith('named suite', expect.any(Function));

        expect(spies.afterEach).not.toHaveBeenCalled();
        expect(spies.it).not.toHaveBeenCalled();

        resetSpies();
        nodeUnitDescribe();
        expect(spies.beforeEach).toHaveBeenCalledTimes(1);
        expect(spies.describe).not.toHaveBeenCalled();
        expect(spies.it).toHaveBeenCalledTimes(2);
        expect(spies.it).toHaveBeenCalledWith('first', expect.any(Function));
        expect(spies.it).toHaveBeenCalledWith('second', expect.any(Function));

    });

});
