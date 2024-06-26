import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

import { run } from '@ember/runloop';

module('Unit | Model | collection', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('collection')
    );

    assert.ok(!!model);
  });
});
