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
  latest: computed('commands.[]', {
    get() {
      return this.commands[0];
    }
  }),
  trusted: computed('commands.[]', function computeTrusted() {
    return this.commands.some(c => c.trusted);
  }),
  isAdmin: computed(function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  versionCommand: computed('selectedVersion', 'commands.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      let paramVersion = this.get('session.data.commandVersion');

      if (paramVersion === 'undefined') {
        return this.commands.findBy('version', version);
      }

      // // tag一覧取得
      // const tags = this.commands.map(c => {
      //   return {
      //     version: c.version,
      //     tag: c.tag
      //   };
      // });

      // console.log('tag一覧');
      // console.log(tags);
      // tags.forEach(t => {
      //   console.log(t);
      // });

      // tagを分解する

      // paramVersionとマッチするtag取得
      // const result = tags.filter(t => t === para);

      // マッチしたtagのバージョン取得

      // commandsを取得したバージョンでフィルタ

      // let tag = this.commands.filter(c => {
      //   // c = 'hogehoge';
      //   console.log('c dayo');
      //   console.log(c);
      //   console.log('commands.filter dayo');
      //   console.log(c.tag.split(' ').some(t => t === paramVersion));
      //   console.log('c dayo');
      //   console.log(c);
      //   console.log('c tag dayo');
      //   console.log(c.tag);

      //   console.log('hikaku dayo');
      //   console.log(c.tag === paramVersion);
      //   // return c.tag === paramVersion;
      //   console.log('split dayo');
      //   console.log(c.tag.split(' '));
      //   // let tests = 'aaa bbb ccc';
      //   let tests = c.tag;
      //   let test = tests.split(' ')[0];
      //   console.log('test dayo');
      //   console.log(test);

      //   let splitted = tests.split(' ');
      //   // return c.tag.split(' ').some(t => t === paramVersion);
      //   return splitted.some(t => t === paramVersion);
      // });

      // let tag = this.commands.filter(c => {
      //   let { tag } = c;
      //   let result = tag.split(' ').find(t => t === paramVersion);

      //   console.log('result を表示します');
      //   console.log(result);

      //   return result;
      // });

      // console.log('コマンドの中身をみたいよ');
      // console.log(this.commands);
      // console.log('controllerのタグだよ、１件だといいな');
      // console.log(tag);

      // if (tag.length > 0) {
      //   return this.commands.findBy('version', tag[0].version);
      // }

      return this.commands.findBy('version', paramVersion);
      // return this.commands.findBy('version', version);
    }
  }),
  // Set selected version to null whenever the list of commands changes
  // eslint-disable-next-line ember/no-observers
  modelObserver: observer('commands.[]', function modelObserver() {
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
