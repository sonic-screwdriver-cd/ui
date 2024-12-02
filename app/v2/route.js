import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewRoute extends Route {
  @service session;

  @service router;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
  }
}
