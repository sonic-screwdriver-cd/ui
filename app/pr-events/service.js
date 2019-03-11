import $ from 'jquery';
import RSVP, { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service(),
  store: service(),
  /**
   * Calls the events api and filters based on type prs
   * @method getPRevents
   * @param  {String}  pipelineId           id of pipeline
   * @param  {String}  eventPrUrl           url of PR
   * @return {Promise}                      Resolves to prCommit
   */
  getPRevents(pipelineId, eventPrUrl, jobId) {
    const eventUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
    `/pipelines/${pipelineId}/events`;
    const buildUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
    `/jobs/${jobId}/builds`;
    const prNum = eventPrUrl.split('/').pop();

    let buildPromise = new EmberPromise(resolve =>
      $.ajax({
        method: 'GET',
        url: buildUrl,
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: `Bearer ${this.get('session').get('data.authenticated.token')}`
        }
      }).done((data) => {
        resolve(data);
      })
    );

    let eventPromise = new EmberPromise(resolve =>
      $.ajax({
        method: 'GET',
        url: eventUrl,
        data: {
          type: 'pr'
        },
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: `Bearer ${this.get('session').get('data.authenticated.token')}`
        }
      }).done((data) => {
        const prCommits = data.filter(curEvent =>
          curEvent.pr && curEvent.pr.url && curEvent.pr.url.split('/').pop() === prNum);

        resolve(prCommits);
      }).catch(() => resolve([]))
    );

    let promises = [buildPromise, eventPromise];

    return new EmberPromise(resolve =>
      RSVP.allSettled(promises).then((array) => {
        const builds = array[0].value;
        const events = array[1].value;
        const prCommits = events.filter(curEvent =>
          curEvent.pr && curEvent.pr.url && curEvent.pr.url.split('/').pop() === prNum);
        let eventBuildPairs = [];

        prCommits.forEach((commit) => {
          const matchingBuild = builds.find(build => build.eventId === commit.id);
          const pair = { event: commit, build: matchingBuild };

          eventBuildPairs.push(pair);
        });

        resolve(eventBuildPairs);
      })
    );
  },
  /**
   * Get a latest pr event of a specified PR job
   * @method getLatestPRjobEvent
   * @param  {Object}  job           PR job
   * @return {Promise}               Resolves to prEvent
   */
  getLatestPRjobEvent(job) {
    return job.get('builds').then((builds) => {
      if (builds.get('length') === 0) {
        return Promise.resolve(null);
      }

      const build = builds.objectAt(0);
      const eventId = build.get('eventId');
      console.log('eventId:', eventId);

      return this.get('store').findRecord('event', eventId);
    });
    /*
    const build = job.get('lastBuild');
    if (!build) {
      return;
    }
    const eventId = build.get('eventId');
    console.log('eventId:', eventId);

    return this.get('store').findRecord('event', eventId);
    */
  }
});
