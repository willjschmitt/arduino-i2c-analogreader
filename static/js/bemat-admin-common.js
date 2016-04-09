/**
 * bemat-admin-common.js v1.0.0
 * http://www.cerocreativo.cl
 *
 * Copyright 2015, Cerocreativo.cl
 * http://www.cerocreativo.cl
 */


/**
 * TOC:
 * 1. Init functions
 * 2. Common functions & variables
 * 2.1. Global common variables
 * 2.2. Private functions
 * 2.3. Public functions
 * 3. Define namespace
 * 4. Helper functions
 */


;$(function(){
	"use strict";

	var App = function(){
		var dis = this;
		$(document).ready(function(){
			dis.init();
		})
	};
	var cc = App.prototype;

	// 1. Init
	// ----------------------------------------------------------------------------
	cc.init = function(){
		// Preload functions
		AppPreload.init();

		// Page OnLoad Functions
		AppOnLoad.init();

		// Header
		AppHeader.init();

		// Sidebar
		AppSidebar.init();

		// Components
		AppComponents.init();
	}


	// 2. Common functions & variables
	// ----------------------------------------------------------------------------
	// 2.1. Global common variables
	var $body 			= $("body"),
		$document 		= $(document),
		$window 		= $(window);
		$.page 			= $("#page-wrapper");
		$.sidebar 		= $("#left-content");
		$.sidebarToggle = $("#sidebar-toggle");
		$.mainContent	= $("#right-content");


	// 2.2. Private Functions
	// ----------------------------------------------------------------------------
	var AppPreload = {
		init: function(){
			//AppPreload.loading();
			//AppPreload.breakpoints();
			AppPreload.windowResize();
		},
		loading: function(){
			var loader = '<div id="loadloader">Loading Page...</div>';
			$body.prepend(loader);
		},
		breakpoints: function(){
			var bp = 
				'<div id="ScreenSize" class="device-breakpoints">'+
					'<div class="visible-xs" data-breakpoint="xs">XS</div>'+
					'<div class="visible-sm" data-breakpoint="sm">SM</div>'+
					'<div class="visible-md" data-breakpoint="md">MD</div>'+
					'<div class="visible-lg" data-breakpoint="lg">LG</div>'+
				'</div>';
			$body.prepend(bp);
		},
		windowResize: function(){
			// Responsive Width Check using Modernizr Media Queries
			$window.on("load resize", function(){
				var sidebarClass 	= "",
					sizeIndex 		= 0;

				if(Modernizr.mq('(min-width: 1200px)')){
					sidebarClass 	= "LG";
					sizeIndex 		= 5;
				} else if(Modernizr.mq('(min-width: 992px)')){
					sidebarClass 	= "MD";
					sizeIndex 		= 4;
				} else if(Modernizr.mq('(min-width: 768px)')){
					sidebarClass 	= "SM";
					sizeIndex 		= 3;
				} else if(Modernizr.mq('(min-width: 480px)')){
					sidebarClass 	= "XS";
					sizeIndex 		= 2;
				} else if(Modernizr.mq('(max-width: 480px)')){
					sidebarClass 	= "XXS";
					sizeIndex 		= 1;
				}
				$body.removeClass("bematScreenLG bematScreenMD bematScreenSM bematScreenXS bematScreenXXS").addClass("bematScreen"+sidebarClass);

				$.event.trigger({
					type: 	"bemat-screen-resize",
					size: 	sidebarClass,
					index: 	sizeIndex
				});
			});
		}
	};

	var AppOnLoad = {
		init: function(){
			$window.load(function(){
				// Here Load Helper Functions
				AppOnLoad.hideLoader();
			});
		},
		hideLoader: function(){
			$("#loadloader").fadeOut();
		},
	};

	var AppHeader = {
		init: function(){
			AppHeader.fullscreen();
		},
		fullscreen: function(){
			// Fullscreen mode
			var fullScreenBtn = $("#fullscreen-toggle");
			fullScreenBtn.on("click",function(){
				$document.toggleFullScreen();
			});
			$document.on("fullscreenchange", function() {
				if ($document.fullScreen()) {
					fullScreenBtn.html('<i class="material-icons">fullscreen_exit</i>');
				} else {
					fullScreenBtn.html('<i class="material-icons">fullscreen</i>');
				}
			});
		}
	};

	var AppSidebar = {
		init: function(){
			$.sidebarToggle.on("click",function(){
				AppSidebar.toggle();
			});
			
			AppSidebar.open();
			AppSidebar.backdrop();

			var sideMenu	= $("#sidebar"),
				parent		= sideMenu.find("li").has("ul").children("ul");
			
			// Set Submenu Style
			sideMenu.find("li").has("ul").children("a").append("<span class='menu-item-submenu-arrow'><i class='fa fa-angle-right'></i></span>");
			$("li:last-child",parent).addClass("lastChild").has("ul").addClass("hasMenu");	
			sideMenu.find('li').not('.open').has('ul').children('ul').wrapInner("<div class='submenu-inner-wrapper'>");
			
			// Bind Click Event
			sideMenu.find('li').has('ul').children('a').on('click', function(e){
				e.preventDefault();
				AppSidebar.toggleSubmenu($(this));
			});

		},
		open: function(){
			$.sidebarToggle.data("state","open").removeClass("SidebarClose").addClass("SidebarOpen")

			/* Open Event */
			$body.removeClass("sidebar-close").addClass("sidebar-open");
			$.sidebar.data("state","open").addClass("SidebarOpen").removeClass("SidebarClose");
			$.mainContent.addClass("SidebarOpen").removeClass("SidebarClose");

			AppSidebar.update();
		},
		close: function(){
			$.sidebarToggle.data("state","close").removeClass("SidebarOpen").addClass("SidebarClose");

			/* Close Event */
			$body.removeClass("sidebar-open").addClass("sidebar-close");
			$.sidebar.data("state","closed").removeClass("SidebarOpen").addClass("SidebarClose");
			$.mainContent.removeClass("SidebarOpen").addClass("SidebarClose");

			AppSidebar.update();
		},
		toggle: function(){
			var st = $.sidebar.data("state");
			if (st == "closed") {
				AppSidebar.open();
			} else  if (st == "open") {
				AppSidebar.close();
			}

			AppSidebar.update();
		},
		update: function(){
			$("#sidebar-wrapper").perfectScrollbar('update');
		},
		toggleSubmenu: function(element){
			var item 			= element.parent("li"),
				itemSubmenu 	= item.children("ul"),
				innerWrapper	= itemSubmenu.children(".submenu-inner-wrapper"),
				innerHeight		= innerWrapper.outerHeight(true);

			/**
			 * Normal Sidebar Open/Close Effect
			 */
			if (innerHeight == 0){
				var clone	= innerWrapper.clone(),
					style	= {
						"display":"block",
						"border":"1px solid red",
						"position":"absolute",
						"top":"0px",
						"left":"0px",
					},
					innerHeight	= clone.css(style).insertAfter(item.children("ul")).outerHeight(true);

				clone.remove();
			}

			item.children("ul").css({"display":"block"});
			var innerHeight		= innerHeight;
			var	slideFx			= {
					"margin-top":"-"+innerHeight+"px",
				};
			if (item.hasClass("open")) {
				innerWrapper.css(slideFx).one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend",function(){
					item.removeClass("open");
					item.children("ul").css({"display":"none"});
					AppSidebar.update;
				});
			} else {
				var slideDown	= {
					"margin-top":"0px",
				};
				item.addClass("open");
				innerWrapper.css(slideFx);
				var stylizeIt = setTimeout(function(){
					innerWrapper.css(slideDown).one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend",function(){
						AppSidebar.update;
					});
				},0);
			}
		},
		backdrop: function(){
			$window.on("bemat-screen-resize",function(e){
				if (e.index <= 2){
					var backdrop = $("#sidebar-backdrop");
					if (backdrop.length) {
						$body.addClass("backdrop-active");
					} else {
						$('<div id="sidebar-backdrop"></div>').insertBefore("#page-wrapper");
					}
				} else {
					var backdrop = $("#sidebar-backdrop");
					if (backdrop.length) {
						backdrop.fadeOut();

						$body.removeClass("backdrop-active");
					}
				}
			})

			$body.on("click","#sidebar-backdrop",function(){
				$body.removeClass("sidebar-open").addClass("sidebar-close");
				AppSidebar.close();
			});
		}
	};

	var AppTheme = {
		init: function(){

		},
		darkHeader: function(){
			$body.addClass("dark-header");
		},
		darkHeaderBrand: function(){
			$body.addClass("dark-header-brand");
		},
		darkHeaderToolbar: function(){
			$body.addClass("dark-header-toolbar");
		},
		darkSidebar: function(){
			$body.addClass("dark-sidebar");
		},
		lightHeader: function(){
			$body.removeClass("dark-header dark-header-brand dark-header-toolbar");
		},
		lightHeaderBrand: function(){
			$body.removeClass("dark-header-brand");
		},
		lightHeaderToolbar: function(){
			$body.removeClass("dark-header-toolbar");
		},
		lightSidebar: function(){
			$body.removeClass("dark-sidebar");
		},
		collapsedSidebar: function(){
			$body.addClass("sidebar-collapsed");
		},
		normalSidebar: function(){
			$body.removeClass("sidebar-collapsed");
		}
	}

	var AppComponents = {
		init: function(){
			ComponentPanel.init();
			ComponentCheckbox.init();
			ComponentSelect.init();
			ComponentDropdown.init();
			ComponentTooltip.init();
			ComponentModals.init();
			ComponentFloatingLabels.init();
			ComponentScrollbar.init();
			ComponentSyntaxHighlight.init();
			ComponentMaterialRipple.init();
			ComponentSnackbar.init();
			ComponentToast.init();
			ComponentSubheader.init();
			ComponentSimplePieCharts.init();
			ComponentLinearProgress.init();
			ComponentCircularProgress.init();
			ComponentSpeedDial.init();
		}
	}

	var ComponentPanel = {
		init: function(){
			// Panel
			var panel = $(".panel-footer").prev(".panel-body").addClass("panel-body-footer");

			// Panel Group
			$(".panel-group .panel .in").each(function() {
				var panel = $(this).parent();
				panel.addClass("open");
			});
			$(".panel-group").on("hide.bs.collapse", function(e) {
				var content = $(e.target);
				var panel = content.parent();
				panel.removeClass("open");
			});
			$(".panel-group").on("show.bs.collapse", function(e) {
				var content = $(e.target);
				var panel = content.parent();
				var group = panel.closest(".panel-group");
				group.find(".panel.expanded").removeClass("open");
				panel.addClass("open");
			});


			// Panel Heading Tools
			// ---------------------------------------------------------------------
			
			// Collapsible Panels
			$("#right-content").on("click",".panel-tools-collapse", function (e) {
				e.preventDefault();
				var btn 	= $(this),
					panel 	= btn.closest(".panel");
					//panel 	= btn.parent().parent().parent(".panel");

				if (panel.data("state") == "panel-collapsed") {
					$(".panel-body",panel).slideDown("slow",function(){
						btn.removeClass("collapsed");
					});
					panel.data("state","panel-open").addClass("panel-open").removeClass("panel-collapsed");
				} else {
					$(".panel-body",panel).slideUp("slow",function(){
						btn.addClass("collapsed");
					});
					panel.data("state","panel-collapsed").addClass("panel-collapsed").removeClass("panel-open");
				}
			});

			// Close Panel
			$("#right-content").on("click",".panel-tools-close",function(e) {
				e.preventDefault();
				var btn 	= $(this),
					panel 	= btn.closest(".panel");

				panel.fadeOut("slow");
			});	
		}
	};

	var ComponentCheckbox = {
		init: function(){
			$("body input[type=checkbox].switch,body input[type=radio].switch").iCheck({
				checkboxClass: 'custom-switch',
				radioClass: 'custom-switch',
				inheritClass: true,
			});
			$("body input[type=checkbox].checkbox").iCheck({
				checkboxClass: 'custom-check',
				inheritClass: true,
			});
			$("body input[type=radio].radio").iCheck({
				radioClass: 'custom-radio',
				inheritClass: true,
			});
		}
	};

	var ComponentSelect = {
		init: function(){
			$("select").selectpicker({
				dropupAuto: false,
				size: 5
			});
			$(".bootstrap-select").on({
				"show.bs.dropdown":function(){
					var obj 		= $(this),
						parent 		= obj.siblings(".bs-select-hidden"),
						btn 		= $(".btn.dropdown-toggle",obj),
						dropdown 	= $(".dropdown-menu",obj),
						content 	= $(".inner",dropdown),
						id 			= $(".selected",dropdown).data("original-index"),
						idReal		= id+1,
						length		= $("li",dropdown).length,
						height 		= parent.outerHeight(),
						itemHeight	= 48,
						padding 	= 8,
						top 		= 0,
						scroll 		= 0,
						factor 		= 0,
						constant 	= itemHeight * 1 / height;				

					if (btn.hasClass("btn-default")){
						btn.removeClass("btn-default");
					}

					if (idReal > 3){
						var iR	= length - idReal;

						if (iR >= 2) {
							factor = 2;
							scroll = length - (iR + 3);
						} else if (iR == 1) {
							factor = 3;
							scroll = length - 2;
						} else if (iR == 0) {
							factor = (length >= 5) ? 4 : 3;
							scroll = length - 3;
						}

						top 	= factor * height * constant + padding;

						content.scrollTop(itemHeight * scroll);

						var style 	= {
								"top":"-"+top+"px"
							};
						dropdown.css(style);
					} else {
						top 	= height * id * constant + padding;
						style 	= {
							"top":"-"+top+"px"
						};

						dropdown.css(style);
						content.scrollTop(0);
					}
					var focusTimer = setTimeout(function(){
						parent.focus();
					},0);

				},
				"hide.bs.dropdown":  function(e) {
					var obj 		= $(this),
						parent 		= obj.siblings(".bs-select-hidden"),
						dropdown 	= $(".dropdown-menu",obj);

					var focusTimer = setTimeout(function(){
						parent.focus();
					},0);
				},
			});
		}
	};

	var ComponentDropdown = {
		init: function(){
			$(".dropdown,.dropup,.btn-group,.input-group-btn").on({
				"show.bs.dropdown":function(){
					var obj 		= $(this),
						btn 		= $('[data-toggle="dropdown"]',obj),
						menu 		= $('.dropdown-menu', obj),
						menuWidth 	= menu.outerWidth(true),
						btnWidth 	= btn.outerWidth(true),
						style 		= {
							"min-width":btnWidth+"px"
						};

					if (menuWidth < btnWidth) {
						menu.css(style);
					}

					/* Dropup Item Animation */
					var items 	= $("li",menu),
						t 		= items.length,
						x 		= 0;

					$.each(items,function(){
						var nCi 	= t - x,
							nC 		= "animation-delay-pos"+nCi;
						$(this).addClass(nC);
						x = x+1;
					});
				},
				"shown.bs.dropdown": function () {
					this.closable	= false;
				},
				"click": function(){
					this.closable	= true;
				},
				"hide.bs.dropdown":  function(e) {
					var obj = $(this);
					if (this.closable) {
						e.preventDefault();
						obj.addClass("closing");

						$('.dropdown-menu', obj).one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function () {
							obj.removeClass('open closing');
						});

					} else {
						return false;
					}
				}
			});
		}
	};

	var ComponentTooltip = {
		init: function(){
			$('[data-toggle="tooltip"]').tooltip({
				template: '<div class="tooltip" role="tooltip"><div class="tooltip-wrapper"><div class="tooltip-background"></div><div class="tooltip-inner"></div></div></div>',
			});
			$('[data-toggle="tooltip"]').on({
				"shown.bs.tooltip": function(){
					var obj 		= $(this),
						tip 		= obj.data("bs.tooltip").tip(),
						h 			= tip.height()/2,
						w 			= tip.width()/2,
						hipo 		= Math.sqrt(h * h + w * w),
						hipo2 		= hipo * 2,
						placement 	= {
							"top"		: "50% bottom 0px",
							"bottom"	: "50% top 0px",
							"left"		: "right 50% 0px",
							"right"		: "left 50% 0px"
						},
						placementActual = placement[obj.data("placement")],
						styles 		= {
							"width":hipo2+"px",
							"height":hipo2+"px",
							"top":"50%",
							"left":"50%",
							"margin-top":"-"+hipo2/2+"px",
							"margin-left":"-"+hipo2/2+"px",
							"transform-origin":placementActual +" !important"
						};

					$(".tooltip-background",tip).css(styles);
					var timeout = setTimeout(function(){
						$(".tooltip-background",tip).addClass("tooltip-show");
					},100);
				},
				"hide.bs.tooltip": function(){
					var obj = $(this),
						tip = obj.data("bs.tooltip").tip();

					$(".tooltip-background",tip).removeClass("tooltip-show");
				}
			});
		}
	};

	var ComponentModals = {
		init: function(){
			$(".modal").on({
				"show.bs.modal":function(e){
					var obj 		= $(this),
						btn 		= $(e.relatedTarget),
						bw 			= btn.outerWidth(),
						bh 			= btn.outerHeight(),
						modal 		= $(".modal-dialog",e.target),
						mw 			= modal.outerWidth(),
						mh 			= modal.outerHeight(),
						rw 			= bw / mw,
						rh 			= bh / mh,
						offset 		= btn.offset();

					modal.data("scale",rw).data("top",offset.top).data("left",offset.left);

					var styles = {
						"transform":"scale("+rw+")",
						"opacity":0,
						"top":offset.top,
						"left":offset.left,
					}
					modal.css(styles);

					var timeOut = setTimeout(function(){
						var stylesX = {
							"transform":"scale(1) translate(-50%,-50%)",
							"opacity":1,
							"top":"50%",
							"left":"50%"
						}
						modal.css(stylesX);
					},550);
				},
				"shown.bs.modal":function(e){
					var modal 		= $(".modal-dialog",e.target);
					var styles = {
						"transform":"scale(1) translate(-50%,-50%)",
						"opacity":1,
						"top":"50%",
						"left":"50%"
					}
					//modal.css(styles);
				},
				"hide.bs.modal":function(e){
					var modal 		= $(".modal-dialog",e.target),
						scale 		= modal.data("scale"),
						top 		= modal.data("top"),
						left 		= modal.data("left");

					var styles = {
						"transform":"scale("+scale+")",
						"opacity":0,
						"top":top,
						"left":left,
					}
					modal.css(styles);
				}
			});
		}
	}

	var ComponentFloatingLabels = {
		init: function(){
			$(".floating-label .form-control").on("keyup change", function(e) {
				var input = $(e.currentTarget);
				if ($.trim(input.val()) !== '') {
					input.addClass("filled").removeClass("static");
				} else {
					input.removeClass("filled").removeClass("static");
				}
			});
			$(".floating-label .form-control").each(function() {
				var input = $(this);
				if ($.trim(input.val()) !== "") {
					input.addClass("static").addClass("filled");
				}
			});
			$(".form-horizontal .form-control").each(function() {
				$(this).after('<div class="form-control-line"></div>');
			});
		}
	};

	var ComponentScrollbar = {
		init: function(){
			$("#sidebar-wrapper,#right-content-wrapper").perfectScrollbar();
			$(".has-custom-sidebar").perfectScrollbar();
		}
	};

	var ComponentSyntaxHighlight = {
		init: function(){
			$("pre").addClass("prettyprint linenums");

			//Load Goodle Code Pretiffy
			window.prettyPrint && prettyPrint();
		}
	}

	var ComponentMaterialRipple = {
		init: function(){
			$(".btn").materialRipple({
				style: "light"
			});

			$("#sidebar ul li a").materialRipple({
				style: "dark"
			});

			$(".dropdown-menu li").materialRipple({
				style: "dark"
			});
		}
	};

	var ComponentSnackbar = {
		init: function(){
			$.snackbar();
		}
	};
	
	var ComponentToast = {
		init: function(){
			$.toasts({
				oneAtTime: false,
			});
		}
	};

	var ComponentSubheader = {
		init: function(){
			$("[data-toggle='subheader']").subheader();
		}
	};

	var ComponentSimplePieCharts = {
		init: function(){
			$("[data-toggle='simple-pie-chart']").simplePieChart({
				size: 130,
				duration: 1000
			});
		}
	};

	var ComponentLinearProgress = {
		init: function(){
			$("[data-toggle='linear-progress']").linearProgress();
		}
	};

	var ComponentCircularProgress = {
		init: function(){
			$("[data-toggle='circular-progress']").circularProgress();
		}
	};

	var ComponentSpeedDial = {
		init: function(){
			$("[data-toggle='speed-dial']").speedDial();
		}
	};


	// 2.3. Public Functions
	// ----------------------------------------------------------------------------
	cc.sidebar = {
		toggle: function(){
			AppSidebar.toggle();
		}
	}

	cc.theme = {
		darkHeaderFull: function(){
			AppTheme.darkHeaderFull();
		},
		darkHeaderBrand: function(){
			AppTheme.darkHeaderBrand();
		},
		darkHeaderToolbar: function(){
			AppTheme.darkHeaderToolbar();
		},
		darkSidebar: function(){
			AppTheme.darkSidebar();
		},
		lightHeaderFull: function(){
			AppTheme.lightHeaderFull();
		},
		lightHeaderBrand: function(){
			AppTheme.lightHeaderBrand();
		},
		lightHeaderToolbar: function(){
			AppTheme.lightHeaderToolbar();
		},
		lightSidebar: function(){
			AppTheme.lightSidebar();
		},
		collapsedSidebar: function(){
			AppTheme.collapsedSidebar();
		},
		normalSidebar: function(){
			AppTheme.normalSidebar();
		},
	}



	// 3. Define Namespace
	// ----------------------------------------------------------------------------
	window.bematadmin 		= window.bematadmin || {};
	window.bematadmin.App 	= new App;
}(jQuery));



// 4. Helper Functions
// --------------------------------------------

/**
 * uniqId() Function to create unique ids
 * @return {[type]} [description]
 */
function uniqId() {
	var d = new Date();
	var n = d.getMilliseconds();
	return Math.round(new Date().getTime() + (Math.random() * 1000));
}

/**
 * Rand Function PHP Clone
 */
function rand(min,max){
	var argc = arguments.length;
	if (argc === 0) {
		min = 0;
		max = 2147483647;
	} else if (argc === 1) {
		throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
	}
	return Math.floor(Math.random() * (max - min + 1)) + min;
}