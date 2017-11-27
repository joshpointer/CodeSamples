<cfsetting showdebugoutput="false">
<cfset variables.jsCssVersion = 1>

<!--- jQuery (need 1.9.1 or higher to support Bootstrap 3.3.5) --->
<script src="/newwebadmin/mvc/common/assets/js/jquery-1.12.1.min.js"></script>

<!--- AngularJS --->
<script src="/newwebadmin/mvc/common/assets/js/angular.min.js"></script>

<!--- Bootstrap --->
<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="/newwebadmin/mvc/common/assets/css/bootstrap.min.css">

<!-- Optional theme -->
<link rel="stylesheet" href="/newwebadmin/mvc/common/assets/css/bootstrap-theme.min.css">

<!-- Latest compiled and minified JavaScript -->
<script src="/newwebadmin/mvc/common/assets/js/bootstrap.min.js"></script>
<!--- /Bootstrap --->

<!--- Toastr (https://github.com/CodeSeven/toastr) (used for growl-style status messages) --->
<link href="/newwebadmin/mvc/common/assets/css/toastr.min.css" rel="stylesheet">
<script src="/newwebadmin/mvc/common/assets/js/toastr.min.js"></script>

<!--- JQVMap (https://github.com/manifestinteractive/jqvmap) --->
<link href="/newwebadmin/mvc/common/assets/css/jqvmap.min.css" rel="stylesheet">
<script src="/newwebadmin/mvc/common/assets/js/jquery.vmap.min.js"></script>
<script src="/newwebadmin/mvc/common/assets/js/jquery.vmap.usa.js"></script>

<cfoutput>

	<!--- Legacy CSS (used for the route_n styles used in the pop-up warehouse menu) --->
	<link rel="stylesheet" type="text/css" href="/newwebadmin/css/style.css">

	<!--- Custom CSS --->
	<link rel="stylesheet" type="text/css" href="/newwebadmin/mvc/logistics/assets/css/returnRouting.css?v=#variables.jsCssVersion#">

	<!--- Custom JS --->
	<script src="/newwebadmin/mvc/logistics/assets/js/returnRouting/app.js?v=#variables.jsCssVersion#"></script>
	<script src="/newwebadmin/mvc/logistics/assets/js/returnRouting/config.js?v=#variables.jsCssVersion#"></script>
	<script src="/newwebadmin/mvc/logistics/assets/js/returnRouting/directives.js?v=#variables.jsCssVersion#"></script>
	<script src="/newwebadmin/mvc/logistics/assets/js/returnRouting/services/MessageService.js?v=#variables.jsCssVersion#"></script>
	<script src="/newwebadmin/mvc/logistics/assets/js/returnRouting/services/ReturnRoutingService.js?v=#variables.jsCssVersion#"></script>
	<script src="/newwebadmin/mvc/logistics/assets/js/returnRouting/controller.js?v=#variables.jsCssVersion#"></script>

</cfoutput>

<div class="container-fluid"
	 ng-app="ReturnRoutingApp"
	 ng-controller="ReturnRoutingController">

	<div id="warehouseMenu">
		<ul ng-mouseenter="clearWarehouseMenuTimeout()"
			ng-mouseleave="hideWarehouseMenu()">
			<li ng-repeat="warehouseNumber in warehousePriorities.warehouses"
				ng-class="getWarehouseClass(warehouseNumber)"
				ng-click="setStateWarehouse(warehouseNumber)"
				ng-style="! $last ? { 'border-bottom': 0 } : ''">
				<span ng-if="warehouseNumber === 0">None</span>
				<span ng-if="warehouseNumber !== 0">{{ warehouseNumber }}</span>
			</li>
		</ul>
	</div>

	<div class="row" id="navigationRow">

		<ol class="col-sm-12 breadcrumb">
			<li class="active"><a href="/newwebadmin/logistics:returnRouting/app">Return Routing</a></li>
		</ol>

	</div> <!--- end .row --->

	<div class="row" id="headerRow">

		<div class="col-md-4" style="margin-bottom:5px">
			<h3>Return Routing</h3>
		</div>

	</div> <!--- end .row --->

	<div class="row">

		<div class="col-md-12">
			<div ng-include=" '/newwebadmin/mvc/logistics/views/returnRouting/partials/section_map.html' "></div>
		</div>

	</div> <!--- end .row --->

</div>
