require([
	"esri/Map",
	"esri/views/MapView",
	"esri/widgets/BasemapGallery",
	"esri/layers/TileLayer",
	"esri/layers/FeatureLayer",
	"esri/widgets/LayerList",
	"esri/widgets/Legend",
	"esri/widgets/Expand",
	"esri/widgets/Home"
], function (
	Map,
	MapView,
	BasemapGallery,
	TileLayer,
	FeatureLayer,
	LayerList,
	Legend,
	Expand,
	Home
) {
	// =====================================================================
	// 1. PROJECT CONFIGURATION
	// =====================================================================
	// Most future edits should happen in this section.
	// Large raster/image map data should stay in ArcGIS Online. GitHub only
	// needs to store this HTML/CSS/JS code and the ArcGIS Online service URLs.

	const appConfig = {
		pests: [
			{
				label: "Mormon Cricket",
				value: "mormon_cricket",
				statsValue: "Mormon Cricket",
				densityLayerPrefix: "MC_Density",
				scientificName: "Anabrus simplex",
				imageCredit: "Photos: Robert Srygley, ARS, USDA",
				images: [
					{
						label: "Third instar nymph",
						url: "images/mormon_cricket_nymph.jpg"
					},
					{
						label: "Male",
						url: "images/mormon_cricket_male.jpg"
					},
					{
						label: "Female",
						url: "images/mormon_cricket_female.jpg"
					}
				],
				description: "Mormon crickets are flightless katydids that can form large migratory bands. They may damage rangeland and cropland by feeding on grasses, forbs, shrubs, and crops. This project currently provides map layers and subregion statistics for Mormon cricket monitoring.",
				primaryConcern: "Large outbreaks can affect forage availability, crop production, and pest management planning.",
				mapAvailability: "Density estimates and environmental layers are currently available for selected years and states."
			}
		],

		years: [
			"2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009",
			"2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017",
			"2018", "2019", "2020"
		],

		states: ["Wyoming", "Nevada", "Idaho"],

		environmentalFactors: [
			"Precipitation",
			"Soil_Moisture",
			"Temperature",
			"Days 20-35 C",
			"NDVI",
			"DEM",
			"Slope",
			"Aspect",
			"TRI"
		],

		boundaryTypes: [
			{
				label: "Climate Divisions",
				value: "climate_divisions"
			}
		],

		stateShortNames: {
			"Wyoming": "WY",
			"Nevada": "NV",
			"Idaho": "ID"
		},

		stateCenters: {
			"Wyoming": [-107.2903, 43.07597],
			"Nevada": [-116.4194, 38.8026],
			"Idaho": [-114.742, 44.0682]
		},

		// ArcGIS Online subregion polygon FeatureLayer URLs by boundary type and state.
		// Use the layer URL that ends with /FeatureServer/0.
		boundaryLayerUrls: {
			climate_divisions: {
				"Wyoming": "https://services.arcgis.com/b3fMqPOmotX6SV4k/arcgis/rest/services/CLIM_DIVISIONS_Wyoming/FeatureServer/2",
				"Nevada": "https://services.arcgis.com/b3fMqPOmotX6SV4k/arcgis/rest/services/CLIM_DIVISIONS_Nevada/FeatureServer/1",
				"Idaho": "https://services.arcgis.com/b3fMqPOmotX6SV4k/arcgis/rest/services/CLIM_DIVISIONS_Idaho/FeatureServer/0"
			}
		},

		// Optional but recommended: a statistics FeatureLayer or table with one row
		// per subregion, pest type, and year.
		// If this is blank, the app tries to read year-specific fields directly
		// from the boundary polygon attributes, such as sampling_2002 and avg_2002.
		statsTableUrl: "https://services.arcgis.com/b3fMqPOmotX6SV4k/arcgis/rest/services/CLIM_DIVISIONS_STAT/FeatureServer/0",

		boundaryFields: {
			id: "sub_id",
			name: "sub_name"
		},

		statsFields: {
			state: "state",
			subregionId: "sub_id",
			pestType: "pest_type",
			year: "year",
			samplingCount: "sampling_n",
			averagePestNumber: "avg_pest_n",
			maximumPestNumber: "max_pest_n"
		},

		boundaryYearFieldPattern: {
			samplingCount: "sampling_{year}",
			averagePestNumber: "avg_{year}",
			maximumPestNumber: "max_{year}"
		}
	};

	// =====================================================================
	// 2. MAP AND UI SETUP
	// =====================================================================

	const homeCenter = [-107, 43.4];
	const homeZoom = 7;

	const map = new Map({ basemap: "topo-vector" });

	const view = new MapView({
		container: "viewDiv",
		map: map,
		center: homeCenter,
		zoom: homeZoom
	});

	view.ui.add("summaryDiv", "bottom-left");

	const homeBtn = new Home({ view: view });
	view.ui.add(homeBtn, "top-left");

	const pestFilter = document.getElementById("pestSelect");
	const yearFilter = document.getElementById("yearSelect");
	const stateFilter = document.getElementById("stateSelect");
	const bioFilter = document.getElementById("bioSelect");
	const boundaryFilter = document.getElementById("boundarySelect");
	const densityOpacitySlider = document.getElementById("densityOpacity");
	const densityOpacityValue = document.getElementById("densityOpacityValue");
	const pestInfoFilter = document.getElementById("pestInfoSelect");
	const pestImageGallery = document.getElementById("pestImageGallery");
	const pestImageCredit = document.getElementById("pestImageCredit");
	const pestName = document.getElementById("pestName");
	const pestDescription = document.getElementById("pestDescription");
	const pestScientificName = document.getElementById("pestScientificName");
	const pestConcern = document.getElementById("pestConcern");
	const pestMapAvailability = document.getElementById("pestMapAvailability");
	const summaryContent = document.getElementById("summaryContent");
	const chartWrap = document.getElementById("chartWrap");
	const samplingChartCanvas = document.getElementById("samplingChart");
	const averageChartCanvas = document.getElementById("averageChart");
	const maximumChartCanvas = document.getElementById("maximumChart");
	const animationPestFilter = document.getElementById("animationPestSelect");
	const animationStateSummary = document.getElementById("animationStateSummary");
	const animationStateOptions = document.getElementById("animationStateOptions");
	const animationYearRange = document.getElementById("animationYearRange");
	const animationYearLabel = document.getElementById("animationYearLabel");
	const animationSpeedFilter = document.getElementById("animationSpeedSelect");
	const animationPlayButton = document.getElementById("animationPlayButton");
	const animationStatus = document.getElementById("animationStatus");

	let selectedPest = appConfig.pests[0].value;
	let selectedYear = "2002";
	let selectedState = "Wyoming";
	let selectedBio = "";
	let selectedBoundaryType = "";
	let boundaryLayer = null;
	let statsLayer = null;
	let timeSeriesCharts = [];
	let pestDensityLayer = null;
	let environmentalLayers = [];
	let mapLegend = null;
	let pestDensityVisible = true;
	let pestDensityOpacity = 1;
	let animationPest = appConfig.pests[0].value;
	let animationStates = ["Wyoming"];
	let animationYearIndex = 0;
	let animationLayerCache = {};
	let animationTimer = null;
	const animationDensityOpacity = 0.78;

	const animationMap = new Map({ basemap: "topo-vector" });
	const animationView = new MapView({
		container: "animationViewDiv",
		map: animationMap,
		center: appConfig.stateCenters[animationStates[0]],
		zoom: 7
	});

	createDropdownOptions();
	createStatsLayer();
	updateMapLayers();
	updateAnimationLayer(true);
	updatePestInformation(selectedPest);
	createWidgets();
	registerEvents();
	registerTabs();

	// =====================================================================
	// 3. DROPDOWN CREATION AND EVENTS
	// =====================================================================

	function createDropdownOptions() {
		appConfig.pests.forEach(function (pest) {
			addOption(pestFilter, pest.value, pest.label);
			addOption(pestInfoFilter, pest.value, pest.label);
			addOption(animationPestFilter, pest.value, pest.label);
		});

		appConfig.years.forEach(function (year) {
			addOption(yearFilter, year, year);
		});

		appConfig.states.forEach(function (state) {
			addOption(stateFilter, state, state);
		});

		createAnimationStateCheckboxes();

		addOption(bioFilter, "", "None");

		appConfig.environmentalFactors.forEach(function (factor) {
			let label = factor;

			if (factor === "Soil_Moisture") {
				label = "Soil Moisture";
			} else if (factor === "DEM") {
				label = "Elevation";
			} else if (factor === "Days 20-35 C") {
				label = "Days 20-35 °C";
			}

			addOption(bioFilter, factor, label);
		});

		addOption(boundaryFilter, "", "None");

		appConfig.boundaryTypes.forEach(function (boundaryType) {
			addOption(boundaryFilter, boundaryType.value, boundaryType.label);
		});

		pestFilter.value = selectedPest;
		pestInfoFilter.value = selectedPest;
		animationPestFilter.value = animationPest;
		yearFilter.value = selectedYear;
		stateFilter.value = selectedState;
		bioFilter.value = selectedBio;
		boundaryFilter.value = selectedBoundaryType;
		animationYearRange.max = String(appConfig.years.length - 1);
		animationYearRange.value = String(animationYearIndex);
		animationYearLabel.textContent = appConfig.years[animationYearIndex];
	}

	function addOption(selectElement, value, label) {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = label;
		selectElement.appendChild(option);
	}

	function createAnimationStateCheckboxes() {
		animationStateOptions.innerHTML = "";

		appConfig.states.forEach(function (state) {
			const optionId = "animationState_" + state.replace(/\s+/g, "_");
			const label = document.createElement("label");
			label.className = "checkbox-option";
			label.setAttribute("for", optionId);

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.id = optionId;
			checkbox.value = state;
			checkbox.checked = animationStates.includes(state);

			const text = document.createElement("span");
			text.textContent = state;

			label.appendChild(checkbox);
			label.appendChild(text);
			animationStateOptions.appendChild(label);
		});

		updateAnimationStateSummary();
	}

	function updateAnimationStateSummary() {
		if (animationStates.length === 1) {
			animationStateSummary.textContent = animationStates[0];
			return;
		}

		animationStateSummary.textContent = animationStates.length + " states selected";
	}

	function registerEvents() {
		pestFilter.addEventListener("change", function (event) {
			selectedPest = event.target.value;
			pestInfoFilter.value = selectedPest;
			updatePestInformation(selectedPest);
			updateMapLayers();
		});

		pestInfoFilter.addEventListener("change", function (event) {
			selectedPest = event.target.value;
			pestFilter.value = selectedPest;
			updatePestInformation(selectedPest);
			updateMapLayers();
		});

		yearFilter.addEventListener("change", function (event) {
			selectedYear = event.target.value;
			updateMapLayers();
		});

		stateFilter.addEventListener("change", function (event) {
			selectedState = event.target.value;
			updateMapLayers();
		});

		bioFilter.addEventListener("change", function (event) {
			selectedBio = event.target.value;
			updateMapLayers();
		});

		boundaryFilter.addEventListener("change", function (event) {
			selectedBoundaryType = event.target.value;
			updateMapLayers();
		});

		animationPestFilter.addEventListener("change", function (event) {
			animationPest = event.target.value;
			updateAnimationLayer(true);
		});

		animationStateOptions.addEventListener("change", function () {
			animationStates = Array.from(animationStateOptions.querySelectorAll("input:checked")).map(function (checkbox) {
				return checkbox.value;
			});

			if (!animationStates.length) {
				animationStates = ["Wyoming"];
				createAnimationStateCheckboxes();
			}

			updateAnimationStateSummary();
			updateAnimationLayer(true);
		});

		animationYearRange.addEventListener("input", function (event) {
			animationYearIndex = Number(event.target.value);
			updateAnimationLayer(false);
		});

		animationPlayButton.addEventListener("click", function () {
			toggleAnimationPlayback();
		});

		densityOpacitySlider.addEventListener("input", function (event) {
			pestDensityOpacity = 1 - Number(event.target.value) / 100;
			updateDensityOpacityLabel();

			if (pestDensityLayer) {
				pestDensityLayer.opacity = pestDensityOpacity;
			}
		});

		view.on("click", function (event) {
			if (!boundaryLayer) {
				return;
			}

			view.hitTest(event).then(function (response) {
				const boundaryHit = response.results.find(function (result) {
					return result.graphic && result.graphic.layer === boundaryLayer;
				});

				if (!boundaryHit) {
					return;
				}

				showSubregionStatistics(boundaryHit.graphic.attributes);
			});
		});
	}

	function registerTabs() {
		const tabButtons = document.querySelectorAll(".tab-button");
		const tabPanels = document.querySelectorAll(".tab-panel");

		tabButtons.forEach(function (button) {
			button.addEventListener("click", function () {
				const targetTab = button.getAttribute("data-tab");

				tabButtons.forEach(function (item) {
					item.classList.toggle("active", item === button);
				});

				tabPanels.forEach(function (panel) {
					panel.classList.toggle("active", panel.id === targetTab);
				});

				if (targetTab === "mapTab") {
					setTimeout(function () {
						view.resize();
					}, 50);
				}

				if (targetTab === "animationTab") {
					setTimeout(function () {
						animationView.resize();
						updateAnimationLayer(true);
					}, 50);
				} else {
					stopAnimationPlayback();
				}
			});
		});
	}

	function updatePestInformation(pestValue) {
		const pest = appConfig.pests.find(function (item) {
			return item.value === pestValue;
		});

		if (!pest) {
			return;
		}

		pestName.textContent = pest.label;
		pestDescription.textContent = pest.description || "";
		pestScientificName.textContent = pest.scientificName || "Not available";
		pestConcern.textContent = pest.primaryConcern || "Not available";
		pestMapAvailability.textContent = pest.mapAvailability || "Not available";
		pestImageGallery.innerHTML = "";

		if (pest.images && pest.images.length) {
			pest.images.forEach(function (image) {
				const figure = document.createElement("figure");
				figure.className = "pest-image-card";

				const img = document.createElement("img");
				img.src = image.url;
				img.alt = pest.label + " " + image.label;

				const caption = document.createElement("figcaption");
				caption.textContent = image.label;

				figure.appendChild(img);
				figure.appendChild(caption);
				pestImageGallery.appendChild(figure);
			});
		} else {
			const placeholder = document.createElement("div");
			placeholder.className = "image-placeholder";
			placeholder.textContent = "Pest images can be added in app.js";
			pestImageGallery.appendChild(placeholder);
		}

		pestImageCredit.textContent = pest.imageCredit || "";
	}

	// =====================================================================
	// 4. PEST AND ENVIRONMENTAL MAP LAYERS
	// =====================================================================

	function updateMapLayers() {
		if (pestDensityLayer) {
			pestDensityVisible = pestDensityLayer.visible;
		}

		map.removeAll();
		environmentalLayers = [];

		addEnvironmentalLayer(selectedYear, selectedState, selectedBio);
		addPestDensityLayer(selectedPest, selectedYear, selectedState);
		addBoundaryLayer(selectedBoundaryType, selectedState);
		updateLegendLayerInfos();

		view.goTo({
			center: appConfig.stateCenters[selectedState],
			zoom: 7
		});
	}

	function addEnvironmentalLayer(year, state, bio) {
		// A blank environmental factor means only the pest density layer is shown.
		if (!bio) {
			return;
		}

		const stateCode = appConfig.stateShortNames[state];
		const seasonalPreviousYearFactors = ["Precipitation", "NDVI", "Temperature", "Soil_Moisture"];
		const currentYearFactors = ["Days 20-35 C"];

		function addEnvironmentalTileLayer(serviceName, title) {
			const layer = addTileLayer(serviceName, title);
			environmentalLayers.push(layer);
			return layer;
		}

		if (seasonalPreviousYearFactors.includes(bio)) {
			const previousYear = parseInt(year, 10) - 1;

			addEnvironmentalTileLayer(bio + "_" + stateCode + "_" + year + "_summer", bio + " in " + state + " " + year + " summer");
			addEnvironmentalTileLayer(bio + "_" + stateCode + "_" + year + "_spring", bio + " in " + state + " " + year + " spring");
			addEnvironmentalTileLayer(bio + "_" + stateCode + "_" + previousYear + "_winter", bio + " in " + state + " " + previousYear + " winter");
			addEnvironmentalTileLayer(bio + "_" + stateCode + "_" + previousYear + "_fall", bio + " in " + state + " " + previousYear + " fall");
		} else if (currentYearFactors.includes(bio)) {
			const serviceName = "Number_of_days_20_to_35_C";
			addEnvironmentalTileLayer(serviceName + "_" + stateCode + "_" + year, bio + " in " + state + " " + year);
		} else {
			addEnvironmentalTileLayer(bio + "_" + stateCode, bio + " in " + state);
		}
	}

	function addPestDensityLayer(pestValue, year, state) {
		const pest = appConfig.pests.find(function (item) {
			return item.value === pestValue;
		});

		const stateCode = appConfig.stateShortNames[state];
		const serviceName = stateCode + "_" + pest.densityLayerPrefix + "_" + year;
		const title = "Estimated " + pest.label + " Density in " + state + " " + year;

		pestDensityLayer = addTileLayer(serviceName, title);
		pestDensityLayer.visible = pestDensityVisible;
		pestDensityLayer.opacity = pestDensityOpacity;

		pestDensityLayer.watch("visible", function (newValue) {
			pestDensityVisible = newValue;
		});
	}

	function updateDensityOpacityLabel() {
		const transparency = Math.round(Number(densityOpacitySlider.value));
		densityOpacityValue.textContent = transparency + "%";
	}

	function addTileLayer(serviceName, title) {
		const layer = new TileLayer({
			url: "https://tiles.arcgis.com/tiles/b3fMqPOmotX6SV4k/arcgis/rest/services/" + serviceName + "/MapServer",
			title: title,
			listMode: "hide-children"
		});

		map.add(layer);
		return layer;
	}

	function updateLegendLayerInfos() {
		if (!mapLegend) {
			return;
		}

		const layerInfos = [];

		if (pestDensityLayer) {
			layerInfos.push({
				layer: pestDensityLayer,
				title: pestDensityLayer.title
			});
		}

		environmentalLayers.forEach(function (layer) {
			layerInfos.push({
				layer: layer,
				title: layer.title
			});
		});

		if (boundaryLayer) {
			layerInfos.push({
				layer: boundaryLayer,
				title: boundaryLayer.title
			});
		}

		mapLegend.layerInfos = layerInfos;
		formatEnvironmentalLegendRanges();
	}

	function formatEnvironmentalLegendRanges() {
		window.requestAnimationFrame(function () {
			const legendContainer = document.getElementById("legendDiv");
			if (!legendContainer) {
				return;
			}

			const environmentalTitles = environmentalLayers.map(function (layer) {
				return layer.title;
			});

			legendContainer.querySelectorAll(".esri-legend__service").forEach(function (service) {
				const serviceTitle = service.querySelector(".esri-legend__service-label");
				if (!serviceTitle || !environmentalTitles.includes(serviceTitle.textContent.trim())) {
					return;
				}

				service.querySelectorAll(".esri-legend__layer-cell--info").forEach(function (label) {
					const rangeMatch = label.textContent.trim().match(/^(-?[\d,.]+)\s*(?:-|–|—|to)\s*(-?[\d,.]+)$/i);
					if (!rangeMatch) {
						return;
					}

					const firstValue = Number(rangeMatch[1].replace(/,/g, ""));
					const secondValue = Number(rangeMatch[2].replace(/,/g, ""));
					if (firstValue > secondValue) {
						label.textContent = rangeMatch[2] + " - " + rangeMatch[1];
					}
				});
			});
		});
	}

	function updateAnimationLayer(shouldGoToSelectedStates) {
		const pest = appConfig.pests.find(function (item) {
			return item.value === animationPest;
		});

		if (!pest) {
			return;
		}

		const year = appConfig.years[animationYearIndex];
		const statesText = animationStates.join(", ");

		preloadAnimationLayers(pest);

		Object.keys(animationLayerCache).forEach(function (key) {
			const layerInfo = animationLayerCache[key];
			const shouldShow = layerInfo.pestValue === animationPest &&
				layerInfo.year === year &&
				animationStates.includes(layerInfo.state);

			layerInfo.layer.opacity = shouldShow ? animationDensityOpacity : 0;
		});

		animationYearLabel.textContent = year;
		animationStatus.textContent = pest.label + " Density in " + statesText + " " + year;

		if (shouldGoToSelectedStates) {
			animationView.goTo(getAnimationViewTarget());
		}
	}

	function preloadAnimationLayers(pest) {
		animationStates.forEach(function (state) {
			appConfig.years.forEach(function (year) {
				const key = animationPest + "|" + state + "|" + year;

				if (animationLayerCache[key]) {
					return;
				}

				const stateCode = appConfig.stateShortNames[state];
				const serviceName = stateCode + "_" + pest.densityLayerPrefix + "_" + year;
				const layer = new TileLayer({
					url: "https://tiles.arcgis.com/tiles/b3fMqPOmotX6SV4k/arcgis/rest/services/" + serviceName + "/MapServer",
					title: pest.label + " Density in " + state + " " + year,
					opacity: 0,
					listMode: "hide"
				});

				animationLayerCache[key] = {
					layer: layer,
					pestValue: animationPest,
					state: state,
					year: year
				};

				animationMap.add(layer);
			});
		});
	}

	function getAnimationViewTarget() {
		if (animationStates.length === 1) {
			return {
				center: appConfig.stateCenters[animationStates[0]],
				zoom: 7
			};
		}

		const center = animationStates.reduce(function (sum, state) {
			sum[0] += appConfig.stateCenters[state][0];
			sum[1] += appConfig.stateCenters[state][1];
			return sum;
		}, [0, 0]);

		center[0] = center[0] / animationStates.length;
		center[1] = center[1] / animationStates.length;

		return {
			center: center,
			zoom: animationStates.length === 2 ? 6 : 6
		};
	}

	function toggleAnimationPlayback() {
		if (animationTimer) {
			stopAnimationPlayback();
			return;
		}

		animationPlayButton.textContent = "Pause";
		animationTimer = setInterval(function () {
			animationYearIndex = animationYearIndex + 1;

			if (animationYearIndex >= appConfig.years.length) {
				animationYearIndex = 0;
			}

			animationYearRange.value = String(animationYearIndex);
			updateAnimationLayer(false);
		}, Number(animationSpeedFilter.value));
	}

	function stopAnimationPlayback() {
		if (animationTimer) {
			clearInterval(animationTimer);
			animationTimer = null;
		}

		animationPlayButton.textContent = "Play";
	}

	// =====================================================================
	// 5. SUBREGION BOUNDARY AND STATISTICS DATA
	// =====================================================================

	function addBoundaryLayer(boundaryType, state) {
		boundaryLayer = null;

		if (!boundaryType) {
			summaryContent.innerHTML = "Select a boundary layer and click a subregion to view statistics.";
			clearSubregionChart();
			return;
		}

		const boundaryConfig = appConfig.boundaryLayerUrls[boundaryType];
		const boundaryLayerUrl = boundaryConfig ? boundaryConfig[state] : "";
		const boundaryLabel = getBoundaryTypeLabel(boundaryType);

		if (!boundaryLayerUrl) {
			summaryContent.innerHTML =
				"<div class='warningText'>" + escapeHtml(boundaryLabel) +
				" boundary is not configured for " + escapeHtml(state) +
				" yet. Add the ArcGIS Online boundary FeatureLayer URL in app.js.</div>";
			clearSubregionChart();
			return;
		}

		boundaryLayer = new FeatureLayer({
			url: boundaryLayerUrl,
			title: state + " " + boundaryLabel + " Boundary",
			outFields: ["*"],
			renderer: {
				type: "simple",
				symbol: {
					type: "simple-fill",
					color: [0, 128, 255, 0.08],
					outline: {
						color: [0, 82, 204, 1],
						width: 1.4
					}
				}
			},
			popupTemplate: {
				title: "{" + appConfig.boundaryFields.name + "}",
				content: "Statistics for this subregion are shown in the Subregion Summary panel."
			}
		});

		map.add(boundaryLayer);
		summaryContent.innerHTML = "Click a " + escapeHtml(boundaryLabel.toLowerCase()) + " subregion to view statistics.";
	}

	function createStatsLayer() {
		if (!appConfig.statsTableUrl) {
			return;
		}

		statsLayer = new FeatureLayer({
			url: appConfig.statsTableUrl,
			outFields: ["*"]
		});
	}

	function showSubregionStatistics(boundaryAttributes) {
		const subregionId = boundaryAttributes[appConfig.boundaryFields.id];
		const subregionName = boundaryAttributes[appConfig.boundaryFields.name] || "Selected Subregion";
		const pestLabel = getSelectedPestLabel();

		summaryContent.innerHTML = "<div class='statusText'>Loading statistics for " + escapeHtml(String(subregionName)) + "...</div>";
		chartWrap.classList.add("hidden");

		if (statsLayer) {
			queryStatsTable(subregionId).then(function (rows) {
				renderSubregionPanel(subregionName, pestLabel, rows);
			}).catch(function (error) {
				console.error(error);
				summaryContent.innerHTML = "Could not load statistics for this subregion.";
			});
		} else {
			const rows = buildRowsFromBoundaryAttributes(boundaryAttributes);
			renderSubregionPanel(subregionName, pestLabel, rows);
		}
	}

	function queryStatsTable(subregionId) {
		const fields = appConfig.statsFields;
		const query = statsLayer.createQuery();
		const pestStatsValue = getSelectedPestStatsValue();
		const subregionWhere = isNumericValue(subregionId)
			? fields.subregionId + " = " + Number(subregionId)
			: fields.subregionId + " = '" + sqlEscape(subregionId) + "'";

		query.where = fields.state + " = '" + sqlEscape(selectedState) + "'" +
			" AND " + subregionWhere +
			" AND " + fields.pestType + " = '" + sqlEscape(pestStatsValue) + "'";
		query.outFields = ["*"];
		query.orderByFields = [fields.year + " ASC"];
		query.returnGeometry = false;

		return statsLayer.queryFeatures(query).then(function (result) {
			return result.features.map(function (feature) {
				return {
					year: String(feature.attributes[fields.year]),
					samplingCount: parseStatNumber(feature.attributes[fields.samplingCount]),
					averagePestNumber: parseStatNumber(feature.attributes[fields.averagePestNumber]),
					maximumPestNumber: parseStatNumber(feature.attributes[fields.maximumPestNumber])
				};
			});
		});
	}

	function buildRowsFromBoundaryAttributes(attributes) {
		return appConfig.years.map(function (year) {
			const samplingField = appConfig.boundaryYearFieldPattern.samplingCount.replace("{year}", year);
			const averageField = appConfig.boundaryYearFieldPattern.averagePestNumber.replace("{year}", year);
			const maximumField = appConfig.boundaryYearFieldPattern.maximumPestNumber.replace("{year}", year);

			return {
				year: year,
				samplingCount: parseStatNumber(attributes[samplingField]),
				averagePestNumber: parseStatNumber(attributes[averageField]),
				maximumPestNumber: parseStatNumber(attributes[maximumField])
			};
		}).filter(function (row) {
			return !isNaN(row.samplingCount) || !isNaN(row.averagePestNumber) || !isNaN(row.maximumPestNumber);
		});
	}

	// =====================================================================
	// 6. SUBREGION SUMMARY PANEL AND TIME-SERIES CHART
	// =====================================================================

	function renderSubregionPanel(subregionName, pestLabel, rows) {
		const currentRow = rows.find(function (row) {
			return String(row.year) === String(selectedYear);
		});

		const samplingText = currentRow && !isNaN(currentRow.samplingCount) ? formatNumber(currentRow.samplingCount) : "No data";
		const averageText = currentRow && !isNaN(currentRow.averagePestNumber) ? formatNumber(currentRow.averagePestNumber) : "No data";
		const maximumText = currentRow && !isNaN(currentRow.maximumPestNumber) ? formatNumber(currentRow.maximumPestNumber) : "No data";

		let html = "";
		html += "<div class='panelTitle'>" + escapeHtml(String(subregionName)) + "</div>";
		html += "<div class='statusText'>" + escapeHtml(pestLabel) + " | " + escapeHtml(selectedYear) + "</div>";
		html += "<div class='metricGrid'>";
		html += "<div class='metricBox'><div class='metricLabel'>Sampling #</div><div class='metricValue'>" + samplingText + "</div></div>";
		html += "<div class='metricBox'><div class='metricLabel'>Average Density (count/sq yd)</div><div class='metricValue'>" + averageText + "</div></div>";
		html += "<div class='metricBox'><div class='metricLabel'>Maximum Density (count/sq yd)</div><div class='metricValue'>" + maximumText + "</div></div>";
		html += "</div>";

		if (rows.length === 0) {
			html += "<div class='warningText'>No time-series statistics were found. Check app.js field names or connect a statistics table.</div>";
		} else {
			html += "<table class='summaryTable'>";
			html += "<tr><th>Year</th><th>Sampling #</th><th>Average Density<br>(count/sq yd)</th><th>Maximum Density<br>(count/sq yd)</th></tr>";
			rows.forEach(function (row) {
				html += "<tr>";
				html += "<td>" + escapeHtml(String(row.year)) + "</td>";
				html += "<td>" + valueOrNoData(row.samplingCount) + "</td>";
				html += "<td>" + valueOrNoData(row.averagePestNumber) + "</td>";
				html += "<td>" + valueOrNoData(row.maximumPestNumber) + "</td>";
				html += "</tr>";
			});
			html += "</table>";
		}

		summaryContent.innerHTML = html;
		renderTimeSeriesChart(rows);
	}

	function renderTimeSeriesChart(rows) {
		destroyTimeSeriesCharts();

		if (!rows.length) {
			chartWrap.classList.add("hidden");
			return;
		}

		chartWrap.classList.remove("hidden");

		const labels = rows.map(function (row) { return row.year; });
		timeSeriesCharts = [
			createMetricChart(samplingChartCanvas, labels, "Sampling #", rows.map(function (row) {
				return isNaN(row.samplingCount) ? null : row.samplingCount;
			}), "#1d4ed8", "rgba(29, 78, 216, 0.12)", "Sampling #"),
			createMetricChart(averageChartCanvas, labels, "Average Density (count/sq yd)", rows.map(function (row) {
				return isNaN(row.averagePestNumber) ? null : row.averagePestNumber;
			}), "#b45309", "rgba(180, 83, 9, 0.12)", "Average Density"),
			createMetricChart(maximumChartCanvas, labels, "Maximum Density (count/sq yd)", rows.map(function (row) {
				return isNaN(row.maximumPestNumber) ? null : row.maximumPestNumber;
			}), "#047857", "rgba(4, 120, 87, 0.12)", "Maximum Density")
		];
	}

	function createMetricChart(canvas, labels, label, data, borderColor, backgroundColor, yAxisTitle) {
		return new Chart(canvas, {
			type: "line",
			data: {
				labels: labels,
				datasets: [{
					label: label,
					data: data,
					borderColor: borderColor,
					backgroundColor: backgroundColor,
					tension: 0.25
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: "index", intersect: false },
				plugins: { legend: { position: "bottom" } },
				scales: {
					y: { title: { display: true, text: yAxisTitle } }
				}
			}
		});
	}

	function destroyTimeSeriesCharts() {
		timeSeriesCharts.forEach(function (chart) { chart.destroy(); });
		timeSeriesCharts = [];
	}

	function clearSubregionChart() {
		destroyTimeSeriesCharts();

		chartWrap.classList.add("hidden");
	}

	// =====================================================================
	// 7. WIDGETS AND HELPERS
	// =====================================================================

	function createWidgets() {
		view.ui.add(createBasemapExpand(view, map), "top-left");
		animationView.ui.add(createBasemapExpand(animationView, animationMap), "top-left");

		const layerListContainer = document.createElement("div");
		layerListContainer.className = "layer-list-panel";

		const layerListTitle = document.createElement("div");
		layerListTitle.className = "layer-list-title";
		layerListTitle.textContent = "Layer Visibility";
		layerListContainer.appendChild(layerListTitle);

		const layerListNode = document.createElement("div");
		layerListContainer.appendChild(layerListNode);

		const layerList = new LayerList({
			view: view,
			container: layerListNode
		});

		const layerListExpand = new Expand({
			view: view,
			content: layerListContainer,
			expanded: true
		});

		view.ui.add(layerListExpand, "top-right");

		mapLegend = new Legend({
			view: view,
			container: "legendDiv",
			layerInfos: []
		});

		const legendContainer = document.getElementById("legendDiv");
		if (legendContainer) {
			new MutationObserver(formatEnvironmentalLegendRanges).observe(legendContainer, {
				childList: true,
				subtree: true
			});
		}

		updateLegendLayerInfos();

	}

	function createBasemapExpand(targetView, targetMap) {
		const basemapPanel = document.createElement("div");
		basemapPanel.className = "basemap-switcher";

		const title = document.createElement("div");
		title.className = "basemap-switcher-title";
		title.textContent = "Basemap";
		basemapPanel.appendChild(title);

		basemapPanel.appendChild(createBasemapButton("Topographic", "topo-vector", targetMap));
		basemapPanel.appendChild(createBasemapButton("Light Gray", "gray-vector", targetMap));

		return new Expand({
			view: targetView,
			content: basemapPanel,
			expandTooltip: "Basemap",
			expanded: false
		});
	}

	function createBasemapButton(label, basemapId, targetMap) {
		const button = document.createElement("button");
		button.className = "basemap-switcher-button";
		button.type = "button";
		button.textContent = label;

		button.addEventListener("click", function () {
			targetMap.basemap = basemapId;
		});

		return button;
	}

	function getSelectedPestLabel() {
		const pest = appConfig.pests.find(function (item) {
			return item.value === selectedPest;
		});
		return pest ? pest.label : selectedPest;
	}

	function getSelectedPestStatsValue() {
		const pest = appConfig.pests.find(function (item) {
			return item.value === selectedPest;
		});

		return pest && pest.statsValue ? pest.statsValue : selectedPest;
	}

	function getBoundaryTypeLabel(boundaryTypeValue) {
		const boundaryType = appConfig.boundaryTypes.find(function (item) {
			return item.value === boundaryTypeValue;
		});

		return boundaryType ? boundaryType.label : boundaryTypeValue;
	}

	function valueOrNoData(value) {
		return isNaN(value) ? "No data" : formatNumber(value);
	}

	function isNumericValue(value) {
		return value !== null && value !== "" && !isNaN(Number(value));
	}

	function parseStatNumber(value) {
		if (value === null || value === undefined || value === "") {
			return NaN;
		}

		const numericValue = Number(value);
		return isNaN(numericValue) ? NaN : numericValue;
	}

	function formatNumber(value) {
		return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
	}

	function escapeHtml(value) {
		return value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	function sqlEscape(value) {
		return String(value).replaceAll("'", "''");
	}
});




