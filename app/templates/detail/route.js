import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  template: service(),
  model(params) {
    return RSVP.all([
      this.template.getOneTemplate(`${params.namespace}/${params.name}`, `${params.version}`),
      this.template.getTemplateTags(params.namespace, params.name)
    ]).then(arr => {
      let [verPayload, tagPayload] = arr;

      if (params.version) {
        const versionPayload = verPayload.filter(t => t.version === params.version);

        if (versionPayload.length === 0) {
          this.transitionTo('/404');
        }
      }

      verPayload = verPayload.filter(t => t.namespace === params.namespace);

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
        }
      });

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
