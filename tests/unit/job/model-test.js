import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

import { run } from '@ember/runloop';

module('Unit | Model | job', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('job')
    );

    assert.ok(!!model);
  });
});
