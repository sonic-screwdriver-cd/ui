import Ember from 'ember';

const scms = [
  {
    context: 'github:github.com',
    displayName: 'github.com',
    iconType: 'fa-github',
    isSignedIn: true
  },
  {
    context: 'bitbucket:bitbucket.org',
    displayName: 'bitbucket.org',
    iconType: 'fa-bitbucket',
    isSignedIn: false
  }
];

/**
 * Inject scm service to an Ember Object
 * @param {Object} self - Ember object generated by ember-qunit moduleFor()
 */
export default function injectScmServiceStub(self) {
  const scmServiceStub = Ember.Object.extend({
    createScms() {
      return Ember.RSVP.resolve(scms);
    },
    getScms() {
      return scms;
    },
    getScm(scmContext) {
      return this.getScms().find(scm => scm.context === scmContext);
    }
  });

  self.register('service:scm', scmServiceStub);
  self.inject.service('scm');
}
