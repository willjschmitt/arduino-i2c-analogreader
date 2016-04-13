/**
 * bemat-admin-calendar.js v1.0.0 (page-calendar.html)
 * http://www.cerocreativo.cl
 *
 * Copyright 2015, Cerocreativo.cl
 * http://www.cerocreativo.cl
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
		// Calendar Init
		AppCalendar.init()
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
		$.calendar 		= $("#bemat-calendar");


	// 2.2. Private Functions
	// ----------------------------------------------------------------------------
	var AppCalendar = {
		init: function(){
			var h 	 	= $(".page-header.alternative-header"),
				overlay	= $('<div class="calendar-bg-overlay"></div>');

			$.calendar.fullCalendar({
				viewRender: function(element){
					AppCalendar.update();
				},
				header: {
					left: '',
					center: 'prev, title, next',
					right: 'today,month,basicWeek,basicDay'
				},
				editable: true,
				eventLimit: true,
				droppable: true,
				drop: function() {
					if ($("#drop-remove").is(":checked")) {
						$(this).remove();
					}
				}
			});

			$("#external-events .fc-event").each(function() {
				$(this).data('event', {
					title: $.trim($(this).text()),
					stick: true
				});
				$(this).draggable({
					zIndex: 999,
					revert: true,
					revertDuration: 400
				});
			});	


			h.append(overlay);
			//AppCalendar.update();
		},
		update: function(){
			var date 	= $.calendar.fullCalendar("getDate"),
				month 	= date._i[1],
				h 	 	= $(".page-header.alternative-header"),
				path 	= "img/bgs/calendar/"+month+".jpg",
				style 	= {
					"background-image":"url("+path+")",
					"background-size":"cover",
					"background-position":"center"
				};

			if ($.calendar.data("month") != month) {
				$.calendar.data("month",month);
				var t = setTimeout(function(){
					var h 	 	= $(".page-header.alternative-header"),
						st1 	= {
								"opacity":"1"
							},
						st2 	= {
								"opacity":"0.4"
							},
						bg 		= $(".calendar-bg-overlay");

					bg.animate(st1,"400",function(){
						h.css(style);
						bg.animate(st2,"400");
					});
				},0);
			}
		}
	};



	// 2.3. Public Functions
	// ----------------------------------------------------------------------------



	// 3. Define Namespace
	// ----------------------------------------------------------------------------
	//window.bematadmin 		= window.bematadmin || {};
	window.bematadmin.Calendar 	= new App;
}(jQuery));



// 4. Helper Functions
// --------------------------------------------

