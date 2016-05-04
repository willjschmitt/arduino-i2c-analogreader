//The build will inline common dependencies into this file.

//For any third party dependencies, like jQuery, place them in the lib folder.

//Configure loading modules from the lib directory,
//except for 'app' ones, which are in a sibling
//directory.
requirejs.config({
    baseUrl: 'static/js',
    paths: {
        "underscore": 'third-party/underscore-min',
        
        //angular
        "angular":          "//ajax.googleapis.com/ajax/libs/angularjs/1.4.4/angular",
        "angular-route":    "//ajax.googleapis.com/ajax/libs/angularjs/1.4.4/angular-route",
        "angular-resource": "//ajax.googleapis.com/ajax/libs/angularjs/1.4.4/angular-resource",
        "angular-sanitize": "//ajax.googleapis.com/ajax/libs/angularjs/1.4.4/angular-sanitize",
        "angularAMD":       "//cdn.jsdelivr.net/angular.amd/0.2/angularAMD.min",
        
        //page plugins
		"prettify":             "../vendor/google-code-prettify/prettify",
		"perfect-scrollbar":    "../vendor/perfectscrollbar/perfect-scrollbar.jquery.min",
		"icheck":               "../vendor/iCheck/icheck.min",
		"bootstrap-select":     "../vendor/bootstrap-select/bootstrap-select.min",
		"datatables.net":       "../vendor/DataTables/js/jquery.dataTables.min",
		"bootstrap_dataTables": "../vendor/DataTables/js/dataTables.bootstrap.min",
		"jquery_fullscreen":    "../vendor/fullscreen/jquery.fullscreen-min",
		"moment":               "third-party/moment",
		"fullcalendar":         "../vendor/fullcalendar/fullcalendar.min",
		"sparkline":            "../vendor/sparkline/jquery.sparkline.min",
		"peity":                "../vendor/peity/jquery.peity.min",
		"chartist":             "../vendor/chartist/chartist.min",
		"summernote":           "../vendor/summernote/summernote.min",
		"ckeditor":             "../vendor/ckeditor/ckeditor",
		"wysihtml5":            "../vendor/wysihtml5/bootstrap3-wysihtml5.all.min",
		
		//cerocreative plugins
		"materialRipple":   "../vendor/materialRipple/jquery.materialRipple",
		"snackbar":         "../vendor/snackbar/jquery.snackbar",
		"toasts":           "../vendor/toasts/jquery.toasts",
		"speedDial":        "../vendor/speedDial/jquery.speedDial",
		"circularProgress": "../vendor/circularProgress/jquery.circularProgress",
		"linearProgress":   "../vendor/linearProgress/jquery.linearProgress",
		"subheader":        "../vendor/subheader/jquery.subheader",
		"simplePieChart":   "lib/jquery.simplePieChart",//"../vendor/simplePieChart/jquery.simplePieChart",
		
		//d3 plugins
		"d3": "../vendor/d3/d3.v3",
		"nvd3": "../vendor/nvd3/nv.d3",
		
		//bemat
		"bemat-common":        "bemat/bemat-admin-common",
		"bemat-demo":          "bemat/bemat-admin-demo",
		"bemat-demo-chartist": "bemat/bemat-admin-demo-chartist",
		"bemat-demo-dashboard":"bemat/bemat-admin-demo-dashboard",
        
		//core deps
        'jquery':    "lib/jquery-1.12.3.min",
		'jquery-ui': "lib/jquery-ui.min",
		'bootstrap': "lib/bootstrap.min",
		'modernizr': "lib/modernizr-2.6.2-respond-1.1.0.min",
		
		//directives
		'timeseries': "angular-lib/timeseries",
		"toggleable-element": "angular-lib/toggleable-element",
		'value-card':"angular-lib/value-card",
		'dial':"angular-lib/dial",
		
    },
    shim : {
        "bootstrap" :       { "deps" :['jquery-ui'] },
        "angularAMD":       ['angular'],
        "angular-route":    ['angular'],
        "angular-resource": ['angular'],
        "angular-sanitize": ['angular'],
        "bemat-common": [],
        
        //jquery plugins
        "perfect-scrollbar": {"deps":['jquery-ui']},
        "icheck": {"deps":['jquery-ui']},
        "jquery_fullscreen": {"deps":['jquery-ui']},
        "peity": {"deps":['jquery-ui']},
        "materialRipple": {"deps":['jquery-ui']},
        "snackbar": {"deps":['jquery-ui']},
        "wysihtml5": {"deps":['jquery-ui']},
        "toasts": {"deps":['jquery-ui']},
        "speedDial": {"deps":['jquery-ui']},
        "circularProgress": {"deps":['jquery-ui']},
        "linearProgress": {"deps":['jquery-ui']},
        "subheader": {"deps":['jquery-ui']},
        "simplePieChart": {"deps":['jquery-ui']},
        "jquery-ui": {"deps":['jquery']},
        
        //bootstrap plugins
        //"bootstrap-select": {"deps":["bootstrap",'jquery']},
        //"bootstrap_dataTables": {"deps":["bootstrap"]},
        "wysihtml5": {"deps":["bootstrap",'jquery']},
        
        "nvd3":{"deps":['d3']},
        
        //bemat reqs
        "bemat-common": {"deps":['perfect-scrollbar','bootstrap-select']},
        "bemat-demo": {"deps":['bemat-common','jquery']},
        "bemat-demo-chartist": {"deps":['bemat-common','jquery']},
        "bemat-demo-dashboard": {"deps":['bemat-common','jquery']},
        
    },
    deps: ['app/dashboard']
});