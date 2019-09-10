import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  command: service(),
  model(params) {
    return RSVP.all([
      this.command.getOneCommand(params.namespace, params.name, params.version),
      this.command.getCommandTags(params.namespace, params.name)
    ]).then(arr => {
      const [verPayload, tagPayload] = arr;

      if (params.version) {
        const versionPayload = verPayload.filter(t => t.version === params.version);
        const tag = tagPayload.filter(c => {
          // console.log('foreatch内');
          // console.log(c.tag);
          // console.log(c.tag === params.version);

          return c.tag === params.version;
        });

        // console.log('tagPayload');
        // console.log(tag);
        if (tag.length === 0 && versionPayload.length === 0) {
          this.transitionTo('/404');
        }
      }

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
        }
      });

      // console.log('tagが欲しい verpayload');
      // console.log(verPayload);

      return verPayload;
    });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.reset();
  },
  actions: {
    error(error) {
      if (error.status === 404) {
        this.transitionTo('/404');
      }

      return true;
    }
  }
});
