define(["qlik", "jquery", "text!./style.css", "text!./template.html"], function (qlik, $, cssContent, template) {
	'use strict';
	$("<style>").html(cssContent).appendTo("head");
	return {
		template: template,
		initialProperties: {
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 10,
					qHeight: 1000
				}]
			}
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 1
				},
				measures: {
					uses: "measures",
					min: 0
				},
				sorting: {
					uses: "sorting"
				},
				settings: {
					uses: "settings",
					items: {
						initFetchRows: { // TODO: Remove this
							ref: "qHyperCubeDef.qInitialDataFetch.0.qHeight",
							label: "Initial fetch rows",
							type: "number",
							defaultValue: 50
						}
					}
				}
			}
		},
		support: {
			snapshot: true,
			export: true,
			exportData: true
		},
		paint: function () {
			//setup scope.table
			if (!this.$scope.table) {
				this.$scope.table = qlik.table(this);
			}
			return qlik.Promise.resolve();
		},
		controller: ['$scope', function ($scope) {

			$scope.startFetch = function () {
				fetchAllData(this, $scope.table, 0, function (table) {

					// Here you can do what you wish with the data and access the hypercube via the variable "table"
					console.log('Qlik Table with all the data', table);

				});
			}

			function fetchAllData(self, table, rowcount, callback) {

				rowcount = typeof rowcount !== 'undefined' ? rowcount : 0;

				var hypercube = table.qHyperCube;
				if (rowcount == 0) {
					for (var i = 0; i < hypercube.qDataPages.length; i++) {
						rowcount += hypercube.qDataPages[i].qMatrix.length; /// Prevents duplication of data
					}
				}
				var colcount = hypercube.qDimensionInfo.length + hypercube.qMeasureInfo.length;



				var requestPage = [{
					qTop: rowcount,
					qLeft: 0,
					qWidth: colcount,
					qHeight: Math.min(1000, table.qHyperCube.qSize.qcy - rowcount)
				}];
				self.backendApi.getData(requestPage).then(function (dataPages) {
					rowcount += dataPages[0].qMatrix.length;

					if (rowcount < hypercube.qSize.qcy) {
						fetchAllData(self, table, rowcount, callback);
					}

					if (rowcount >= hypercube.qSize.qcy) {
						callback(table);
					}

				});
			}

		}]
	};

});
