sap.ui.define(['sap/ui/core/Control'], function (Control) {
  'use strict';
  return Control.extend('shocktwin.controls.SupplierGraph', {
    metadata: { properties: { graph: { type: 'object', defaultValue: null } } },
    renderer: {
      apiVersion: 2,
      render: function (rm, control) {
        rm.openStart('div', control)
          .class('stSupplierGraph')
          .attr('data-testid', 'supplier-graph')
          .attr('role', 'img')
          .attr(
            'aria-label',
            'Supplier dependency graph. Inferred relationships are dashed amber; the review cards provide accessible confidence and evidence.',
          )
          .attr('tabindex', '0')
          .openEnd()
          .close('div');
      },
    },
    onAfterRendering: function () {
      const element = this.getDomRef();
      if (!element) return;
      const d3 = window.d3;
      if (!d3) {
        element.textContent =
          'The graph renderer could not load. Supplier relationships remain available in the review cards.';
        return;
      }
      const graph = this.getGraph() || {};
      const width = Math.max(element.clientWidth, 680);
      const height = 440;
      const nodes = (graph.nodes || []).map(function (node) {
        return { ...node };
      });
      const nodeIds = new Set(
        nodes.map(function (node) {
          return node.id;
        }),
      );
      const links = (graph.links || [])
        .filter(function (link) {
          return (
            link.reviewStatus !== 'rejected' && nodeIds.has(link.source) && nodeIds.has(link.target)
          );
        })
        .map(function (link) {
          return { ...link };
        });
      const suppliers = nodes
        .filter(function (node) {
          return node.type === 'supplier' && Number(node.tier) === 1;
        })
        .sort(function (a, b) {
          return a.id.localeCompare(b.id);
        });
      nodes.forEach(function (node) {
        if (node.id === 'buyer' || node.type === 'company') {
          node.tx = width * 0.16;
          node.ty = height * 0.5;
        } else if (
          suppliers.some(function (supplier) {
            return supplier.id === node.id;
          })
        ) {
          node.tx = width * 0.5;
          node.ty =
            75 +
            suppliers.findIndex(function (supplier) {
              return supplier.id === node.id;
            }) *
              74;
        } else if (node.id === 'resin-plant') {
          node.tx = width * 0.83;
          node.ty = 105;
        } else {
          const connected = links.find(function (link) {
            return link.source === node.id;
          });
          const targetIndex = connected
            ? suppliers.findIndex(function (supplier) {
                return supplier.id === connected.target;
              })
            : 3;
          node.tx = width * 0.83;
          node.ty = 140 + Math.max(0, targetIndex) * 52;
        }
        node.x = node.tx;
        node.y = node.ty;
      });
      const simulation = d3
        .forceSimulation(nodes)
        .randomSource(d3.randomLcg(42))
        .force(
          'x',
          d3
            .forceX(function (node) {
              return node.tx;
            })
            .strength(0.9),
        )
        .force(
          'y',
          d3
            .forceY(function (node) {
              return node.ty;
            })
            .strength(0.9),
        )
        .force('collision', d3.forceCollide(34))
        .stop();
      simulation.tick(100);
      const byId = new Map(
        nodes.map(function (node) {
          return [node.id, node];
        }),
      );
      d3.select(element).selectAll('*').remove();
      const svg = d3
        .select(element)
        .append('svg')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('aria-hidden', 'true');
      const defs = svg.append('defs');
      const pattern = defs
        .append('pattern')
        .attr('id', this.getId() + '-dots')
        .attr('width', 20)
        .attr('height', 20)
        .attr('patternUnits', 'userSpaceOnUse');
      pattern.append('circle').attr('cx', 1).attr('cy', 1).attr('r', 0.8).attr('fill', '#dce6e5');
      svg
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#' + this.getId() + '-dots)');
      [0.16, 0.5, 0.83].forEach(function (x, index) {
        svg
          .append('text')
          .attr('x', width * x)
          .attr('y', 26)
          .attr('text-anchor', 'middle')
          .attr('class', 'stGraphColumn')
          .text(['YOUR PLANT', 'TIER 1 SUPPLIERS', 'UPSTREAM NETWORK'][index]);
      });
      links.forEach(function (link) {
        const source = byId.get(link.source);
        const target = byId.get(link.target);
        const inferred = link.inferred;
        const sourceRadius = source.id === 'resin-plant' ? 28 : 20;
        const targetRadius = target.id === 'buyer' ? 29 : 17;
        const sx = source.x - sourceRadius;
        const tx = target.x + targetRadius;
        const middle = (sx + tx) / 2;
        svg
          .append('path')
          .attr(
            'd',
            'M' +
              sx +
              ',' +
              source.y +
              ' C' +
              middle +
              ',' +
              source.y +
              ' ' +
              middle +
              ',' +
              target.y +
              ' ' +
              tx +
              ',' +
              target.y,
          )
          .attr('fill', 'none')
          .attr('stroke', inferred ? '#d7922d' : '#bbcaca')
          .attr('stroke-width', inferred ? 2.3 : 1.6)
          .attr('stroke-dasharray', inferred ? '7 5' : null)
          .attr('opacity', inferred ? 0.95 : 0.8);
        if (inferred) {
          const lx = middle - 4;
          const ly = (source.y + target.y) / 2 - 4;
          svg
            .append('rect')
            .attr('x', lx - 25)
            .attr('y', ly - 12)
            .attr('width', 50)
            .attr('height', 21)
            .attr('rx', 7)
            .attr('fill', '#fff7e9')
            .attr('stroke', '#edce97');
          svg
            .append('text')
            .attr('x', lx)
            .attr('y', ly + 2)
            .attr('text-anchor', 'middle')
            .attr('class', 'stGraphConfidence')
            .text((Number(link.confidence) * 100).toFixed(1) + '%');
        }
      });
      const groups = svg
        .selectAll('g.stGraphNode')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'stGraphNode')
        .attr('transform', function (node) {
          return 'translate(' + node.x + ',' + node.y + ')';
        });
      groups.each(function (node) {
        const group = d3.select(this);
        const buyer = node.id === 'buyer' || node.type === 'company';
        const shared = node.id === 'resin-plant';
        if (shared)
          group.append('circle').attr('r', 37).attr('fill', '#fff1d9').attr('opacity', 0.8);
        group
          .append('circle')
          .attr('r', buyer ? 29 : shared ? 27 : 18)
          .attr('fill', buyer ? '#123e4a' : shared ? '#fff4dd' : '#ffffff')
          .attr('stroke', shared ? '#d7922d' : buyer ? '#123e4a' : '#8aa5a6')
          .attr('stroke-width', shared ? 2.5 : 1.5);
        group
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .attr('class', 'stGraphInitial')
          .attr('fill', buyer ? 'white' : shared ? '#8b5a15' : '#345a62')
          .text(
            buyer ? 'YOU' : shared ? 'R' : node.type === 'plant' ? 'P' : node.id.replace('s', 'S'),
          );
        const name = buyer ? 'Priya Auto Components' : node.name || node.id;
        const chunks =
          name.length > 22
            ? [
                name.substring(0, name.lastIndexOf(' ', 22) > 0 ? name.lastIndexOf(' ', 22) : 22),
                name.substring(name.lastIndexOf(' ', 22) > 0 ? name.lastIndexOf(' ', 22) + 1 : 22),
              ]
            : [name];
        chunks.slice(0, 2).forEach(function (chunk, index) {
          group
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('y', (buyer ? 48 : shared ? 47 : 34) + index * 14)
            .attr('class', shared ? 'stGraphLabel stGraphLabelRisk' : 'stGraphLabel')
            .text(chunk);
        });
        if (shared)
          group
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 77)
            .attr('class', 'stGraphRiskFlag')
            .text('SHARED DEPENDENCY');
        group
          .append('title')
          .text(
            name +
              (shared
                ? '. Inferred upstream dependency; review model confidence and evidence.'
                : '. ' + (node.location || 'Illustrative location')),
          );
      });
    },
  });
});
