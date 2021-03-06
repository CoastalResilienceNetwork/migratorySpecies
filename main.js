// Bring in dojo and javascript api classes as well as varObject.json, js files, and content.html
define([
	"dojo/_base/declare", "framework/PluginBase", "dijit/layout/ContentPane", "dojo/dom", "dojo/dom-style", "dojo/dom-geometry", "dojo/text!./obj.json", 
	"dojo/text!./html/content.html", './js/esriapi', './js/clicks', './js/variables', 'dojo/_base/lang'	
],
function ( 	declare, PluginBase, ContentPane, dom, domStyle, domGeom, obj, content, esriapi, clicks, variables, lang ) {
	return declare(PluginBase, {
		// The height and width are set here when an infographic is defined. When the user click Continue it rebuilds the app window with whatever you put in.
		toolbarName: "Energy Planning", fullName: "Energy Planning", showServiceLayersInLegend: true, allowIdentifyWhenActive: false, rendered: false, resizable: false,
		hasCustomPrint: false, size:'custom', width:594, hasHelp:false, 
		
		// First function called when the user clicks the pluging icon. 
		initialize: function (frameworkParameters) {
			// Access framework parameters
			declare.safeMixin(this, frameworkParameters);
			this.$cn = $(this.container);
			// Define object to access global variables from JSON object. Only add variables to varObject.json that are needed by Save and Share. 
			this.obj = dojo.eval("[" + obj + "]")[0];	
			this.url = "https://services2.coastalresilience.org/arcgis/rest/services/Gulf_of_Mexico/Migratory_Blueways/MapServer";
		},
		// Called after initialize at plugin startup (why the tests for undefined). Also called after deactivate when user closes app by clicking X. 
		hibernate: function () {
			if (this.appDiv != undefined){
				this.dynamicLayer.setVisibleLayers([-1])
			}
			this.open = "no";
		},
		// Called after hibernate at app startup. Calls the render function which builds the plugins elements and functions.   
		activate: function (showHelpOnStart) {
			this.$cn.prev('.sidebar-nav').find('.nav-title').css("margin-left", "25px");
			if (this.rendered == false) {
				this.rendered = true;							
				this.render();
				$(this.printButton).hide();
				ga('send','event',{
					eventCategory: 'Energy Planning', 
					eventAction: 'App opened', 
					eventLabel: 'Initial open'
				});
			}else{
				this.dynamicLayer.setVisibleLayers(this.obj.visibleLayers);
				$('#' + this.id).parent().parent().css('display', 'flex');
				ga('send','event',{
					eventCategory: 'Energy Planning', 
					eventAction: 'App opened', 
					eventLabel: 'Additional opening'
				});
			}
			this.open = "yes";
		},
		// Called when user hits the minimize '_' icon on the pluging. Also called before hibernate when users closes app by clicking 'X'.
		deactivate: function () {
			ga('send','event',{
				eventCategory: 'Energy Planning', 
				eventAction: 'App closed', 
				eventLabel: 'closed or minimized app'
			});
			this.open = "no";	
		},	
		// Called when user hits 'Save and Share' button. This creates the url that builds the app at a given state using JSON. 
		// Write anything to you varObject.json file you have tracked during user activity.		
		getState: function () {
			// remove this conditional statement when minimize is added
			if ( $('#' + this.id ).is(":visible") ){
				//extent
				this.obj.extent = this.map.geographicExtent;
				this.obj.stateSet = "yes";	
				var state = new Object();
				state = this.obj;
				return state;	
			}
		},
		// Called before activate only when plugin is started from a getState url. 
		//It's overwrites the default JSON definfed in initialize with the saved stae JSON.
		setState: function (state) {
			this.obj = state;
		},
		// Called when the user hits the print icon
		beforePrint: function(printDeferred, $printArea, mapObject) {
			printDeferred.resolve();
		},	
		// Called by activate and builds the plugins elements and functions
		render: function() {
			//this.oid = -1;
			//$('.basemap-selector').trigger('change', 3);
			this.mapScale  = this.map.getScale();
			// BRING IN OTHER JS FILES
			this.esriapi = new esriapi();
			this.clicks = new clicks();
			this.variables = new variables();
			// ADD HTML TO APP
			$(this.container).parent().append('<button id="viewMbInfoGraphicIcon" class="button button-default ig-icon" title="Infographic"><img src="plugins/migratory-blueways/images/InfographicIcon_v1_23x23.png" alt="show overview graphic"></button>')
			$(this.container).parent().find("#viewMbInfoGraphicIcon").on('click',function(c){
				TINY.box.show({
					animate: true,
					url: 'plugins/migratory-blueways/html/info-graphic.html',
					fixed: true,
					width: 800,
					height: 601
				});
			})
			// Define Content Pane as HTML parent		
			this.appDiv = new ContentPane({style:'padding:8px; flex:1; display:flex; flex-direction:column; height:100%;'});
			this.id = this.appDiv.id
			dom.byId(this.container).appendChild(this.appDiv.domNode);	
			$('#' + this.id).parent().addClass('flexColumn')
			if (this.obj.stateSet == "no"){
				$('#' + this.id).parent().parent().css('display', 'flex')
			}		
			// Get html from content.html, prepend appDiv.id to html element id's, and add to appDiv
			var idUpdate0 = content.replace(/for="/g, 'for="' + this.id);	
			var idUpdate = idUpdate0.replace(/id="/g, 'id="' + this.id);
			$('#' + this.id).html(idUpdate);
			this.variables.makeVariables(this);			
			// Create ESRI objects and event listeners	
			this.esriapi.esriApiFunctions(this);
			// Click listeners
			this.clicks.eventListeners(this);
			this.rendered = true;	
		}
	});
});
