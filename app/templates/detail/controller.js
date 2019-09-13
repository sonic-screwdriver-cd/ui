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
  trusted: computed('templates.templateData.[]', function computeTrusted() {
    return this.templates.some(t => t.trusted);
  }),
  isAdmin: computed(function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  latest: computed('templates.templateData.[]', {
    get() {
      return this.templates.templateData[0];
    }
  }),
  versionTemplate: computed('selectedVersion', 'templates.templateData.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      let paramVersion = this.templates.param;
      let tagAndVersionList = this.templates.templateTag;

      if (paramVersion === 'undefined') {
        return this.templates.templateData.findBy('version', version);
      }

      let exsistTag = tagAndVersionList.filter(t => t.tag === paramVersion);

      if (exsistTag.length > 0) {
        return this.templates.templateData.findBy('version', exsistTag[0].version);
      }

      return this.templates.templateData.findBy('version', paramVersion);
    }
  }),
  // Set selected version to null whenever the list of templates changes
  // eslint-disable-next-line ember/no-observers
  modelObserver: observer('templates.templateData.[]', function modelObserver() {
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
