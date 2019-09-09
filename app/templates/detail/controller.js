import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';
import Controller from '@ember/controller';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  session: service(),
  template: service(),
  templates: alias('model'),
  reset() {
    this.set('errorMessage', '');
  },
  trusted: computed('templates.[]', function computeTrusted() {
    return this.templates.some(t => t.trusted);
  }),
  isAdmin: computed(function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  latest: computed('templates.[]', {
    get() {
      return this.templates[0];
    }
  }),
  versionTemplate: computed('selectedVersion', 'templates.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      let paramVersion = this.get('session.data.templateVersion');

      if (paramVersion === 'undefined') {
        return this.templates.findBy('version', version);
      }

      let tag = this.templates.filter(t => t.tag === paramVersion);

      if (tag.length > 0) {
        return this.templates.findBy('version', tag[0].version);
      }

      return this.templates.findBy('version', paramVersion);
    }
  }),
  // Set selected version to null whenever the list of templates changes
  // eslint-disable-next-line ember/no-observers
  modelObserver: observer('templates.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    },
    removeTemplate(name) {
      return this.template
        .deleteTemplates(name)
        .then(() => this.transitionToRoute('templates'), err => this.set('errorMessage', err));
    },
    updateTrust(fullName, toTrust) {
      return (
        this.isAdmin &&
        this.template.updateTrust(fullName, toTrust).catch(err => this.set('errorMessage', err))
      );
    }
  }
});
