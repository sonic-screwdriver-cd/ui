import { computed } from '@ember/object';
import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  classNameBindings: ['build.status'],
  setBuild: async function() {
    this.build = (await this.job.builds).objectAt(0);
  },
  build: computed('job.builds', {
    get() {
      this.setBuild();

      if (this._build) {
        return this._build;
      }

      return {};
    },
    set(_, value) {
      return this._build = value;
    }
  }),
  displayName: computed('job.name', 'workflowGraph.nodes', {
    get() {
      const nodes = this.get('workflowGraph.nodes');
      const jobName = this.get('job.name').replace('PR-', '').split(':').pop();
      const matchedNode = nodes.find(node => node.name === jobName);

      if (matchedNode && matchedNode.displayName) {
        return matchedNode.displayName;
      }

      return jobName;
    }
  }),
  icon: computed('build.status', {
    get() {
      return statusIcon(this.build.status, true);
    },
  })
});
