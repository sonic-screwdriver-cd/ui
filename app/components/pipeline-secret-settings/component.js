import { sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  newName: null,
  newValue: null,
  newAllow: false,
  errorMessage: '',
  secretsSorting: ['name'],
  sortedSecrets: sort('secrets', 'secretsSorting'),
  isButtonDisabled: computed('newName', 'newValue', {
    get() {
      return !this.newName || !this.newValue;
    }
  }),
  eyeSlash: false,
  actions: {
    /**
     * Kicks off create secret flow
     * @method addNewSecret
     */
    addNewSecret() {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(this.newName)) {
        this.set(
          'errorMessage',
          'Secret keys can only consist of numbers, ' +
            'uppercase letters and underscores, and cannot begin with a number.'
        );

        return false;
      }

      this.onCreateSecret(
        this.newName,
        this.newValue,
        this.get('pipeline.id'),
        this.newAllow
      );
      this.set('newName', null);
      this.set('newValue', null);
      this.set('newAllow', false);

      return true;
    },
    /**
     * Toggle eye-icon and password input type
     * @method togglePasswordInput
     * @param {Object} event Click event
     */
    togglePasswordInput() {
      this.set('eyeSlash', !this.eyeSlash);
    }
  }
});
