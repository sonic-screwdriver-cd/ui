// import Route from '@ember/routing/route';
import EventsRoute from '../events/route';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import { isPRJob } from 'screwdriver-ui/utils/build';

export default EventsRoute.extend({
  controllerName: 'pipeline.events',
  prEventsService: service('pr-events'),
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('activeTab', 'pulls');
    //controller.set('paginateEvents', []);
  },
  renderTemplate() {
    this.render('pipeline.events');
  },
  model() {
    this.controllerFor('pipeline.events').set('pipeline', this.get('pipeline'));
    const jobs = this.get('pipeline.jobs');

    return RSVP.hash({
      jobs,
      // fetch latest events which belongs to each PR jobs.
      events: jobs.then((jobs) => {
        return Promise.all(
          jobs.filter(j => isPRJob(j.get('name')))
            .map(j => this.get('prEventsService').getLatestPRjobEvent(j))
        );
      })
    });
  },
  actions: {
    refreshModel: function refreshModel() {
      this.refresh();
    }
  }
});
