import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | error view', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('sc', 400);
    this.set('sm', 'they are dead, dave');
    await render(
      hbs`<ErrorView @errorMessage="bananas" @statusCode={{this.sc}} @statusMessage={{this.sm}} />`
    );

    assert.dom('h1').hasText('400');
    assert.dom('h2').hasText('they are dead, dave');
    assert.dom('h4').hasText('bananas');
  });
});
