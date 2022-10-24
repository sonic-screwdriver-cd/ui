import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';

module(
  'Unit | Route | pipeline/job-latest-build/artifacts/index',
  function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
      const route = this.owner.lookup(
        'route:pipeline/job-latest-build/artifacts/index'
      );

      assert.ok(route);
    });

    test('it redirects to artifacts page', function (assert) {
      assert.expect(2);

      const route = this.owner.lookup(
        'route:pipeline/job-latest-build/artifacts/index'
      );
      const transitionStub = sinon.stub(route, 'transitionTo');
      const model = {
        pipelineId: 1,
        id: 2
      };

      route.afterModel(model);

      assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
      assert.ok(
        transitionStub.calledWithExactly(
          'pipeline.build.artifacts.index',
          1,
          2
        ),
        'transition to build artifacts'
      );
    });
  }
);
