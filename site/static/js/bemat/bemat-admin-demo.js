/**
 * bemat-admin-demo.js v1.0.0
 * http://www.cerocreativo.cl
 *
 * Copyright 2015, Cerocreativo.cl
 * http://www.cerocreativo.cl
 */

var initstate = (function() {
	/**
	 * Bemat Colors
	 */
	$(function($) {
		$("#demoBematColor1").on("ifChecked",function(){
			bematadmin.App.theme.lightHeaderBrand();
		});
		$("#demoBematColor2").on("ifChecked",function(){
			bematadmin.App.theme.darkHeaderBrand();
		});
		$("#demoBematColor3").on("ifChecked",function(){
			bematadmin.App.theme.lightHeaderToolbar();
		});
		$("#demoBematColor4").on("ifChecked",function(){
			bematadmin.App.theme.darkHeaderToolbar();
		});
		$("#demoBematColor5").on("ifChecked",function(){
			bematadmin.App.theme.lightSidebar();
		});
		$("#demoBematColor6").on("ifChecked",function(){
			bematadmin.App.theme.darkSidebar();
		});

		$(".theme-switcher").on("click",function(e){
			e.preventDefault();
			var theme = $(this).data("theme");
			themeSwitcher(theme);
		});

		function themeSwitcher(theme){
			$("#theme-switcher").each(function () {
				var href = $(this).attr("href"),
					href = href.replace(/(css\/themes)(.*)(\/)/g,"css/themes/"+theme+"/");

				var url = "../"+href;
				$.get(url, function(){
					var t = setTimeout(function(){
						$("#theme-switcher").attr("href", href);
						$.toasts("add",{
							msg: 		"Theme Activated",
						});
					},1000);
				});
			});
		}
	});


	/**
	 * Bootstrap3 wysihtml5 Editor
	 */
	$(function($){
		$("#wysihtml5").wysihtml5({
			toolbar: {
				fa: true
			}
		});
	});


	/**
	 * CKEditor
	 */
	$(function($) {
		//$("#ckeditor").ckeditor();
	});



	/**
	 * Summernote Editor
	 */
	$(function($) {
		$("#summernote").summernote();
	});



	/**
	 * Simple Pie Charts
	 */
	$(function($) {
		setProgress(0);

		function setProgress(){
			var progress = rand(0,100);
			if (progress > 100) {
				progress = 1;
			}

			$(".bemat-pie-chart-live-update").simplePieChart("set",progress);
			var timeOut = setTimeout(function(){
				setProgress();
			},2000);
		}
	});



	/**
	 * Peity
	 */
	$(function($) {
		$(".peity-line").peity("line",{
			height: 28,
			width: 64
		});
		$(".peity-bar").peity("bar",{
			height: 28,
			width: 64
		});
		$(".peity-donut").peity("donut",{
			height: 28,
			width: 64
		});
		$(".peity-pie").peity("pie",{
			height: 28,
			width: 64
		});
	});





	/**
	 * Calendar - Add Events to the calendar
	 */
	$(function($){
		var events = [
				{
					title: 'All Day Event',
					start: '2015-12-01'
				},
				{
					title: 'Long Event',
					start: '2015-12-07',
					end: '2015-12-10'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2015-12-09T16:00:00'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2015-12-16T16:00:00'
				},
				{
					title: 'Conference',
					start: '2015-12-11',
					end: '2015-12-13'
				},
				{
					title: 'Meeting',
					start: '2015-12-12T10:30:00',
					end: '2015-12-12T12:30:00'
				},
				{
					title: 'Lunch',
					start: '2015-12-12T12:00:00'
				},
				{
					title: 'Meeting',
					start: '2015-12-12T14:30:00'
				},
				{
					title: 'Happy Hour',
					start: '2015-12-12T17:30:00'
				},
				{
					title: 'Dinner',
					start: '2015-12-12T20:00:00'
				},
				{
					title: 'Birthday Party',
					start: '2015-12-13T07:00:00'
				},
				{
					title: 'Click for Google',
					url: 'http://google.com/',
					start: '2015-12-28'
				},
				{
					title: 'All Day Event',
					start: '2016-01-01'
				},
				{
					title: 'Long Event',
					start: '2016-01-07',
					end: '2016-01-10'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2016-01-09T16:00:00'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2016-01-16T16:00:00'
				},
				{
					title: 'Conference',
					start: '2016-01-11',
					end: '2016-01-13'
				},
				{
					title: 'Meeting',
					start: '2016-01-12T10:30:00',
					end: '2016-01-12T12:30:00'
				},
				{
					title: 'Lunch',
					start: '2016-01-12T12:00:00'
				},
				{
					title: 'Meeting',
					start: '2016-01-12T14:30:00'
				},
				{
					title: 'Happy Hour',
					start: '2016-01-12T17:30:00'
				},
				{
					title: 'Dinner',
					start: '2016-01-12T20:00:00'
				},
				{
					title: 'Birthday Party',
					start: '2016-01-13T07:00:00'
				},
				{
					title: 'Click for Google',
					url: 'http://google.com/',
					start: '2016-01-28'
				}
			];
		$("#bemat-calendar").fullCalendar("addEventSource",events,true);
	});



	/**
	 * DataTables
	 */
	$("#tableDataTables1").dataTable();



	/**
	 * Linear Progress
	 */
	$(function() {
		setProgress(0);
		setBuffer(0);

		function setProgress(val){
			var progress = val +5;
			if (progress > 100) {
				progress = 1;
			}

			$(".linear-progress-demo-determinate").linearProgress("setProgress",progress);
			var timeOut = setTimeout(function(){
				setProgress(progress);
			},500);
		}

		function setBuffer(val){
			var progress 	= val +1,
				buffer 		= progress + Math.sqrt((progress * progress) + 50);

			if (buffer >= 100) { buffer = 100; }
			if (progress >= 100) { progress = 0; }
			if (progress == 0) { buffer = 0; }

			$(".linear-progress-demo-buffer").linearProgress("setProgress",progress);
			$(".linear-progress-demo-buffer").linearProgress("setBuffer",buffer);

			var timeOut = setTimeout(function(){
				setBuffer(progress);
			},200);
		}

		$(".btn-linear-progress-demo-1").on("click",function(){
			$(".linear-progress-demo-determinate2").linearProgress("setProgress",15);
		});
		$(".btn-linear-progress-demo-2").on("click",function(){
			$(".linear-progress-demo-determinate2").linearProgress("setProgress",67);
		});
		$(".btn-linear-progress-demo-3").on("click",function(){
			$(".linear-progress-demo-determinate2").linearProgress("setProgress",100);
		});
	});


	/**
	 * Circular Preloader
	 */
	$(function() {
		setProgress(0);

		function setProgress(val){
			var progress = val +5;
			if (progress > 100) {
				progress = 1;
			}

			$(".circular-preloader-demo-determinate").circularProgress("set",progress);
			var timeOut = setTimeout(function(){
				setProgress(progress);
			},500);
		}


		$(".btn-circular-progress-demo-1").on("click",function(){
			$(".circular-preloader-demo-determinate2").circularProgress("set",25);
		});
		$(".btn-circular-progress-demo-2").on("click",function(){
			$(".circular-preloader-demo-determinate2").circularProgress("set",73);
		});
		$(".btn-circular-progress-demo-3").on("click",function(){
			$(".circular-preloader-demo-determinate2").circularProgress("set",100);
		});
		$(".btn-circular-progress-demo-4").on("click",function(){
			$(".circular-preloader-demo-indeterminate2").circularProgress("pause");
		});
		$(".btn-circular-progress-demo-5").on("click",function(){
			$(".circular-preloader-demo-indeterminate2").circularProgress("play");
		});
		$(".btn-circular-progress-demo-6").on("click",function(){
			$(".circular-preloader-demo-indeterminate2").circularProgress("hide");
		});
		$(".btn-circular-progress-demo-7").on("click",function(){
			$(".circular-preloader-demo-indeterminate2").circularProgress("show");
		});
	});






	/**
	 * Speed Dial Plugin
	 */
	$(".radio-up-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("direction","up");
	});
	$(".radio-down-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("direction","down");
	});
	$(".radio-left-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("direction","left");
	});
	$(".radio-right-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("direction","right");
	});
	$(".radio-open-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("open");
	});
	$(".radio-close-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("close");
	});
	$(".radio-fling-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("mode","fling");
	});
	$(".radio-scale-fabspeeddial").on('ifChecked', function(event){
		$("#demo-speed-dial").speedDial("mode","scale");
	});


	/**
	 * Toasts Plugin
	 */

	$("#btntest-toast1").on("click",function(){
		$.toasts("add",{
			msg: 		"This is a Demo Toast",
		});
	});

	$("#demoToastRadio1").on("ifChecked",function(){
		var r1 = $('[name="demoToast1"]:checked').val(),
			r2 = $('[name="demoToast2"]:checked').val(),
			pos = r1 +" "+ r2;
		$.toasts("position",pos);
	});
	$("#demoToastRadio2").on("ifChecked",function(){
		var r1 = $('[name="demoToast1"]:checked').val(),
			r2 = $('[name="demoToast2"]:checked').val(),
			pos = r1 +" "+ r2;
		$.toasts("position",pos);
	});
	$("#demoToastRadio3").on("ifChecked",function(){
		var r1 = $('[name="demoToast1"]:checked').val(),
			r2 = $('[name="demoToast2"]:checked').val(),
			pos = r1 +" "+ r2;
		$.toasts("position",pos);
	});
			$("#demoToastRadio4").on("ifChecked",function(){
		var r1 = $('[name="demoToast1"]:checked').val(),
			r2 = $('[name="demoToast2"]:checked').val(),
			pos = r1 +" "+ r2;
		$.toasts("position",pos);
	});


	/**
	 * Snackbar Plugin
	 */
	$(document).on("show.cc.snackbar",function(){
		console.log("Snackbar shown");
	});

	$("#btntest-snackbar1").on("click",function(){
		$.snackbar("add",{
			type: 		"success",
			msg: 		"Message sent",
			buttonText: "Close",
		});
	});
	$("#btntest-snackbar2").on("click",function(){
		$.snackbar("add",{
			type: 		"info",
			msg: 		"Marked as read",
			buttonText: "Undo",
		});
	});
	$("#btntest-snackbar3").on("click",function(){
		$.snackbar("add",{
			type: 		"warning",
			msg: 		"This item already has the label 'travel'. You can add a new label.",
			buttonText: "Close",
			disappearTime: 10000,
		});
	});
	$("#btntest-snackbar4").on("click",function(){
		$.snackbar("add",{
			type: 		"danger",
			msg: 		"Connection timed out. Showing limited messages.",
			buttonText: "Close",
		});
	});



	/**
	 * Sparkline Charts
	 */
	$(function() {
		$(".sparkline-line").sparkline("html", {
			type: "line",
		});
		$(".sparkline-bar").sparkline("html", {
			type: "bar",
			barColor: "rgb(235,86,66)",
			height: "30px",
			barWidth: "5px",
			barSpacing: "2px",
			zeroAxis: false
		});
		$(".sparkline-tristate").sparkline("html", {
			type: "tristate",
		});
		$(".sparkline-discrete").sparkline("html", {
			type: "discrete",

		});
		$(".sparkline-bullet").sparkline("html", {
			type: "bullet",

		});
		$(".sparkline-pie").sparkline("html", {
			type: "pie",

		});
		$(".sparkline-box").sparkline("html", {
			type: "box",
		});
	});


})();