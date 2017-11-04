$(document).ready(function(){
	
	$('.parallax').parallax();
	$('select').material_select();
	$('ul.tabs').tabs();
	$('.modal').modal();

	$('#BOXCreateNetwork').hide();
	$('#BOXTrainingNetwork').hide();
	$('#BOXTestNetwork').hide();
	$('#BoxEraseTraining').hide();
	$('.InfoTraining').hide();
	$('#BoxGraphResults').hide();
	$('#BoxDataTest').hide();
	
	$('#BoxTableResults').hide();
	
	$('#BoxNetworkInfo').hide();

	$('#BtnBoxMain').click(function(event){
		event.preventDefault();
		$('#BOXCreateNetwork').hide(500);
		$('#BOXTrainingNetwork').hide(500);
		$('#BOXTestNetwork').hide(500);

		$('#BOXMain').show(500);
	});

	$('#BtnBoxCreate').click(function(event){
		event.preventDefault();
		$('#BOXMain').hide(500);
		$('#BOXTrainingNetwork').hide(500);
		$('#BOXTestNetwork').hide(500);

		$('#BOXCreateNetwork').show(500);
	});

	$('#BtnBoxTraining').click(function(event){
		event.preventDefault();
		$('#BOXMain').hide(500);
		$('#BOXCreateNetwork').hide(500);
		$('#BOXTestNetwork').hide(500);

		$('#BOXTrainingNetwork').show(500);
	});

	$('#BtnBoxTest').click(function(event){
		event.preventDefault();
		$('#BOXMain').hide(500);
		$('#BOXCreateNetwork').hide(500);
		$('#BOXTrainingNetwork').hide(500);

		$('#BOXTestNetwork').show(500);
	});

	$('#CheckboxData').click(function(){

		$('#CheckboxTextarea').prop('checked', false);

		if( !($('#BoxDataTest').css('display') == 'none') )
			$('#BoxDataTest').hide(1000);

	});

	$('#CheckboxTextarea').click(function(){

		$('#CheckboxData').prop('checked', false);
		
		if( $('#BoxDataTest').css('display') == 'none' )
			$('#BoxDataTest').show(1000);
		else
			$('#BoxDataTest').hide(1000);
	});

	$('#FormatDataOriginal').click(function(){
		$('#FormatDataNormalized').prop('checked', false);
	});

	$('#FormatDataNormalized').click(function(){
		$('#FormatDataOriginal').prop('checked', false);
	});

});
