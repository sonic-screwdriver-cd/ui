import { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  session: service(),
  command: service(),
  commands: alias('model'),
  reset() {
    this.set('errorMessage', '');
  },
  latest: computed('commands.commandData.[]', {
    get() {
      return this.commands.commandData[0];
    }
  }),
  trusted: computed('commands.commandData.[]', function computeTrusted() {
    return this.commands.commandData.some(c => c.trusted);
  }),
  isAdmin: computed(function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  versionCommand: computed('selectedVersion', 'commands.commandData.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      let paramVersion = this.commands.param;

      let tagAndVersionList = this.commands.commandTag;

      if (paramVersion === undefined) {
        return this.commands.commandData.findBy('version', version);
      }

      let exsistTag = tagAndVersionList.filter(t => t.tag === paramVersion);

      if (exsistTag.length > 0) {
        return this.commands.commandData.findBy('version', exsistTag[0].version);
      }

      return this.commands.commandData.findBy('version', paramVersion);
    }
  }),
  // Set selected version to null whenever the list of commands changes
  // eslint-disable-next-line ember/no-observers
  modelObserver: observer('commands.commandData.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    },
    removeCommand(namespace, name) {
      return this.command
        .deleteCommands(namespace, name)
        .then(() => this.transitionToRoute('commands'), err => this.set('errorMessage', err));
    },
    updateTrust(namespace, name, toTrust) {
      return (
        this.isAdmin &&
        this.command
          .updateTrust(namespace, name, toTrust)
          .catch(err => this.set('errorMessage', err))
      );
    }
  }
});
