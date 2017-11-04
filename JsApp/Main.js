$(document).ready(function(){

	// [ Neural Network Object ]
	// NN.Name
	// NN.Definition
	// NN.DefinitionArray
	// NN.LearningRate
	// NN.LearningMomentum
	// NN.ActivationFunction
	// NN.Network
	// NN.NetworkExport
	// NN.Training
	// NN.Test

	// [ Training Object ]
	// NN.Training.Error
	// NN.Training.Epoch
	// NN.Training.File
	// NN.Training.FileName
	// NN.Training.NumberData
	// NN.Training.NumberAttributes
	// NN.Training.NumberClasses
	// NN.Training.Data
	// NN.Training.NormalizedData
	// NN.Training.Results
	// NN.Training.IndexEpoch
	// NN.Training.With

	// [ Test Object ]
	// NN.Test.CrossValidation
	// NN.Test.Data
	// NN.Test.Result
	// NN.Test.PromError
	// NN.Test.DataTest
	// NN.Test.ResultTest

	var NN = new Object();

	// CREAR RED
	$('#BtnCreate').click(function(){

		// OBTENEMOS VALORES Y EVALUAMOS, SI NO SON VALIDOS TERMINA LA EJECUCION
		NN.Name 			 = EvaluteTheField( $('#Name').val()				,'Name');		if(NN.Name 				< 0) return;
		NN.DefinitionArray 	 = EvaluteTheField( $('#Definition').val()			,'Definition'); if(NN.DefinitionArray 	< 0) return;
		NN.LearningRate 	 = EvaluteTheField( $('#LearningRate').val()		,'Number');		if(NN.LearningRate 		< 0) return;
		NN.LearningMomentum  = EvaluteTheField( $('#LearningMomentum').val()	,'Number');		if(NN.LearningMomentum 	< 0) return;
		NN.ActivationFunction= EvaluteTheField( $('#ActivationFunction').val()	,'Function');	if(NN.ActivationFunction< 0) return;
		NN.Definition  = $('#Definition').val();
		NN.DefinitionArray.push(1);
		
		CreateNewNetwork();

		// MOSTRAMOS LA INFORMACION DE LA RED EN LA TABLA DE INFORMACION (TAB)
		InformationNetwork( 0 );
		ShowTab('tabNetworkInfo');
		ShowMessage('CREADA!');
	});

	// CARGAR RED
	$('#BtnLoadNetwork').click(function(){

		// OBTENEMOS Y EVALUAMOS EL ARCHIVO, SI ESTE NO ES VALIDO LA EJECUCION TERMINA.
		var File = EvaluteTheField( document.getElementById('FileNeuralNetwork').files[0], 'FileNetwork'); if( File < 0 ) return;

		// CREAMOS UN PROCESO PARA LEER EL ARCHIVO
		var fileReader = new FileReader();
		fileReader.onload = getNetwork;
		fileReader.readAsText( File );

		// FUNCION QUE TRANSFORMA EL ARCHIVO .IBM A UN OBJETO (NN)
		function getNetwork(event){
			
			// EXTRAEMOS LA INFORMACION DEL ARCHIVO Y LO CONVERTIMOS A OBJETO (NN)
			NN = JSON.parse( event.currentTarget.result.substr(0, 102400) );
			
			// ACCEDEMOS A LA RED EXPORTADA, LA RECONSTRUIMOS Y LA REASIGNAMOS
			NN.Network = FANN.create( NN.NetworkExport );

			// MOSTRAMOS LA INFORMACION DE LA RED EN LA TABLA DE INFORMACION (TAB)
			InformationNetwork( 1 );
			ShowTab('tabNetworkInfo');
			ShowTab('tabTrainingResults');
			SetHTML('InfoLastValue', 'Error Final: '+  NN.Training.Results[ NN.Training.Results.length-1 ] );
			ShowMessage('CARGADA!');
			SetHighchartsTraining();
		}
	});

	// ENTRENAR RED
	$('#BtnTraining').click(function(){

		if( typeof NN.Network == 'undefined' ){
			ShowMessage("No EXISTE una red!");
			return;
		}

		NN.Training = new Object();
		NN.Training.IndexEpoch = 0;

		NN.Training.Error = EvaluteTheField( $('#Error').val()	,'Number'); if(NN.Training.Error < 0) return;
		NN.Training.Epoch = EvaluteTheField( $('#Epoch').val()	,'Number'); if(NN.Training.Epoch < 0) return;
		var File = EvaluteTheField( document.getElementById('FileTrainingData').files[0], 'FileData'); if( File < 0 ) return;

		NN.Training.FileName = File.name;

		var fileReader = new FileReader();
		fileReader.onload = getTrainingData;
		fileReader.readAsText( File );

		// OBTIENE LOS ATRIBUTOS Y CLASES DESDE EL ARCHIVO PARA EL ENTREAMIENTO
		function getTrainingData(event){

			var TrainingDataTXT = event.currentTarget.result.substr(0, 102400);

			// SEPARAMOS POR LINEAS TODO EL ARCHIVO INCLUYE TAMAÑO DE DATOS, ATRIBUTOS, CLASES Y DATOS
			var StringArray = TrainingDataTXT.split('\n');

			// ASIGNAMOS LOS ATRIBUTOS DE LOS DATOS
			NN.Training.NumberData		 = Number( StringArray[0] );
			NN.Training.NumberAttributes = Number( StringArray[1] );
			NN.Training.NumberClasses 	 = Number( StringArray[2] );


			// OBTENEMOS LOS ATRIBUTOS/CLAES Y LOS ASIGNAMOS
			NN.Training.Data = new Array();
			var ArrayAttributes, ArrayClass;
			for(var i=0; i < NN.Training.NumberData; i++){

				ArrayAttributes = ArrayOfAttributes( StringArray[i+3] );
				ArrayClass = ArrayOfClass( StringArray[i+3] );

				NN.Training.Data[i] = [ ArrayAttributes, ArrayClass ];
			}

			// NORMALIZAR Y ENTRENAR
			NormalizedData();
			TrainNow();

			// APARTIR DE UNA LINEA DE TEXTO CON ATRIBUTOS/CLASES, REGRESA LOS ATRIBUTOS EN UN ARREGLO
			function ArrayOfAttributes( _String  ){
				
				var ArrayData = _String.split(',');
				var Attributes = new Array();
				
				for(var i=0; i < ArrayData.length-1; i++)
					Attributes[i] = Number( ArrayData[i] );
				
				return Attributes;
			}

			// APARTIR DE UNA LINEA DE TEXTO CON ATRIBUTOS/CLASES, REGRESA LAS CLASES EN UN ARREGLO
			function ArrayOfClass( _String ){

				var ArrayData = _String.split(',');
				var ArrayClass = new Array();
				ArrayClass[0] = Number( ArrayData[ ArrayData.length-1 ] );

				return ArrayClass;
			}
		}

		// NORMALIZA LOS DATOS DE ENTREAMIENTO Y LOS ASIGNA A UNA MATRIZ SOLO CON VALORES NORMALIZADOS
		function NormalizedData(){

			NN.Training.NormalizedData = new Array();
			
			// OBTENEMOS EL MAXIMO Y MINIMO RESPECTO A LAS CLASES
			var MinClass = Number.MAX_VALUE;
			var MaxClass = Number.MIN_VALUE;
			for(var i=0; i < NN.Training.NumberData ; i++){
				
				if( NN.Training.Data[i][1][0] < MinClass )
					MinClass = NN.Training.Data[i][1][0];

				if( NN.Training.Data[i][1][0] > MaxClass )
					MaxClass = NN.Training.Data[i][1][0];
			}

			// MINIMO Y MAXIMO DE LOS ATRIBUTOS, NORMALIZACION DE ATRIBUTOS/CLASES Y ASIGNACION.
			var Min, Max, NormAttributes, NormClass ;
			for(var i=0; i < NN.Training.NumberData; i++){

				// OBTENEMOS EL MAXIMO Y MINIMO DEL CASO DE PRUEBA
				Min = Number.MAX_VALUE;
				Max = Number.MIN_VALUE;
				for(var j=0; j < NN.Training.NumberAttributes; j++){

					if( NN.Training.Data[i][0][j] < Min )
						Min = NN.Training.Data[i][0][j];

					if( NN.Training.Data[i][0][j] > Max )
						Max = NN.Training.Data[i][0][j];
				}

				// NORMALIZAMOS LOS ATRIBUTOS DEL CASO DE PRUEBA CON EL MINIMO Y MAXIMO
				NormAttributes = new Array();
				for(var k=0; k < NN.Training.NumberAttributes; k++){

					if( Min == Max )
						NormAttributes[k] = 1;
					else
						if( (NN.Training.Data[i][0][k] - Min) == 0 || (Max - Min) == 0 )
							NormAttributes[k] = 0;
						else
							NormAttributes[k] =  Number( (NN.Training.Data[i][0][k] - Min) / (Max - Min) );
				}

				// NORMALIZAMOS EL VALOR DE LA CLASE
				NormClass = new Array();
				if( MinClass == MaxClass )
					NormClass[0] = 1;
				else
					if( (NN.Training.Data[i][1][0] - MinClass) == 0 || (MaxClass - MinClass) == 0 )
						NormClass[0] = 0;
					else
						NormClass[0] = Number( (NN.Training.Data[i][1][0]-MinClass) / (MaxClass - MinClass) );

				// ASIGNAMOS LOS VALORES NORMALIZADOS
				NN.Training.NormalizedData[i] = [ NormAttributes, NormClass ];
			}
		}

		// ENTRENA LA RED APARTIR DE LOS DATOS ORIGINALES/NORMALIZADOS.
		function TrainNow(){

			var DataUsed;

			if( isChecked('FormatDataOriginal') ){

				NN.Training.With = "Original";
				DataUsed = FANN.createTraining( NN.Training.Data );

			}else if( isChecked('FormatDataNormalized') ){

				NN.Training.With = "Normalizados";
				DataUsed = FANN.createTraining( NN.Training.NormalizedData );

			}else{
				ShowMessage('Selecciona una CASILLA!');
				return;
			}

			if( NN.Training.NumberAttributes != NN.DefinitionArray[0] ){
				ShowMessage('La DEFINICION no coincide con los datos!');
				ShowMessage('ATRIBUTOS de los DATOS: '+ NN.Training.NumberAttributes );
				ShowMessage('DEFINICION en la capa de ENTRADA: '+ NN.DefinitionArray[0] );
				return;
			}

			var i = NN.Training.IndexEpoch;
			if( i == 0 ) NN.Training.Results = new Array();

			while( i < NN.Training.Epoch )
				NN.Training.Results[i++] = NN.Network.train_epoch( DataUsed  );

			NN.Training.IndexEpoch = i;
			NN.Training.Epoch = NN.Training.Results.length;

			InformationNetwork( 1 );
			
			ShowMessage('ENTRENADA!');
			ShowTab('tabTrainingResults');
			SetHTML('InfoLastValue', 'Error Final: '+  NN.Training.Results[--i] );

			SetHighchartsTraining();
		}
	});

	// VALIDAR RED
	$('#BtnValidate').click(function(){

		if( typeof NN.Network == 'undefined' ){
			ShowMessage("No EXISTE una red!");
			return;
		}

		if( typeof NN.Training.Results == 'undefined' ){
			ShowMessage("La red NO esta ENTRENADA!");
			return;
		}


		NN.Test = new Object();
		NN.Test.CrossValidation = EvaluteTheField($('#CrossValidation').val(), 'Number'); if( NN.Test.CrossValidation < 0 ) return;
		
		if( NN.Test.CrossValidation > NN.Training.NumberData ){
			ShowMessage('La validacion es MAYOR que los datos!');
			return;
		}

		var SizeBlock = Math.trunc( NN.Training.NumberData / NN.Test.CrossValidation );

		NN.Test.Data = [];
		var i = 0 ,k = 0, SubArray;

		for(var j=0; j < NN.Test.CrossValidation; j++){

			i = j * SizeBlock;
			k = 0;

			SubArray = [];

			while( i < SizeBlock * j + SizeBlock ){
				if( NN.Training.With == "Original" )
					SubArray[k++] = NN.Training.Data[i++];
				else
					SubArray[k++] = NN.Training.NormalizedData[i++];
			}

			NN.Test.Data[j] = SubArray;
		}


		var Data;
		NN.Test.Result = new Array();
		NN.Test.PromError = 0;

		for( i = 0; i < NN.Test.CrossValidation; i++){
			Data = FANN.createTraining( NN.Test.Data[i] );
			NN.Test.Result[i] = NN.Network.test_data( Data );
			NN.Test.PromError += NN.Test.Result[i];
		}

		NN.Test.PromError /= NN.Test.CrossValidation;

		hide('BoxTableResults');
		show('BoxGraphResults');
		ShowTab('tabTestResults');
		SetHTML('InfoTestError', "Promedio del Error: "+ NN.Test.PromError);
		SetHighchartsEvaluation();
	});

	// PROBAR RED
	$('#BtnTest').click(function(){

		if( typeof NN.Network == 'undefined' ){
			ShowMessage("No EXISTE una red!");
			return;
		}

		if( typeof NN.Training.Results == 'undefined' ){
			ShowMessage("La red NO esta ENTRENADA!");
			return;
		}

		if( isChecked('CheckboxData') )
			TestTrainingData();
		else if( isChecked('CheckboxTextarea') )
			TestTextarea();
		else{
			ShowMessage('Selecciona una CASILLA!');
			return;
		}

		function TestTrainingData(){

			if( NN.Training.With == "Original" )
				NN.Test.DataTest = NN.Training.Data;
			else
				NN.Test.DataTest = NN.Training.NormalizedData;

			NN.Test.ResultTest = new Array();

			var HTMLTable = "<thead>"+
								"<tr>"+
									"<th>Caso de Prueba</th>"+
									"<th>Valor Asignado</th>"+
									"<th>Valor Real</th>"+
								"</tr>"+
							"</thead>"+
							"<tbody>";


			for(var i=0; i < NN.Training.NumberData; i++){
				NN.Test.ResultTest[i] = NN.Network.run( NN.Test.DataTest[i][0] )[0];
				HTMLTable += "<tr>"+
								"<td>"+ DoubleToString(NN.Test.DataTest[i][0]) + "</td>"+
								"<td>"+ DoubleToString([NN.Test.ResultTest[i]]) + "</td>"+
								"<td>"+ NN.Test.DataTest[i][1] + "</td>"+
							"</tr>";
			}

			HTMLTable += "</tbody>";

			hide('BoxGraphResults');
			show('BoxTableResults');
			ShowTab('tabTestResults');
			SetHTML('TableResults', HTMLTable);
		}

		function TestTextarea(){

			var StringTextarea = $('#DataTestTextarea').val();
			var Lines = StringTextarea.split('\n');

			console.log( Lines );

			if( Lines[0] == "" ){
				ShowMessage('Ingrese MINIMO un caso de prueba!');
				return;
			}

			

			var SubArray, SubLine, DataTest = new Array();
			for(var i=0; i < Lines.length; i++){

				SubLine = Lines[i].split(',');

				if( SubLine.length < NN.Training.NumberAttributes ){
					ShowMessage('Caso de prueba INVALIDO!');
					ShowMessage('La ATRIBUTOS Necesarios Son: ' + NN.Training.NumberAttributes);
					ShowMessage('Separados por COMA');
					return;
				}

				SubArray = new Array();
				
				for(var j=0; j < SubLine.length; j++){

					if (  Number( SubLine[j] ) >= 0 )
						SubArray[j] =  Number( SubLine[j] );
					else{
						ShowMessage('Solo datos NUMERICOS!');
						return;
					}
				}

				DataTest[i] = SubArray;
			}

			var Test = new Object();

			Test.Using = "Cases";
			Test.DataTest = DataTest;
			Test.ResultTest = new Array();

			var HTMLTable = "<thead>"+
								"<tr>"+
									"<th>Caso de Prueba</th>"+
									"<th>Valor Asignado</th>"+
								"</tr>"+
							"</thead>"+
							"<tbody>";

			for(var i=0; i < Test.DataTest.length; i++){
				Test.ResultTest[i] = NN.Network.run( Test.DataTest[i] )[0];

				HTMLTable += "<tr>"+
								"<td>"+ Test.DataTest[i] + "</td>"+
								"<td>"+ DoubleToString([Test.ResultTest[i]]) + "</td>"+
							"</tr>";
			}

			HTMLTable += "</tbody>";

			$('#BoxGraphResults').hide();
			$('#BoxTableResults').show();
			$('#TableResults').html( HTMLTable );
			$('ul.tabs').tabs('select_tab', 'tabTestResults');
		}
	});

	// ELIMINAR ENTRENAMIENTO
	$('#BtnEraseTraining').click(function(){

		hide('BoxEraseTraining');
		hide('BoxTableResults');
		hide('BoxGraphResults');
		ShowTab('tabTraining');
		CreateNewNetwork();
	});

	// DESCARGAR RED
	$('#BtnDownload').click(function(){

		var BtnDownload = $('#BtnDownload');
		NN.NetworkExport = NN.Network.export();

		BtnDownload.attr('download', NN.Name + "_" + NN.Definition + ".ibm");
		BtnDownload.attr('href', "data:application/octet-stream," + encodeURIComponent( JSON.stringify( NN ) ) );
	});

	// VER DATOS DE ENTRENAMIENTO ORIGINALES
	$('#BtnViewData').click(function(){
		$('#ModalFileName').html( NN.Training.FileName );
		$('#ModalText').html( ArrayToString( NN.Training.Data ) );
		$('#ModalText').trigger('autoresize');
		$('#ModalFile').modal('open');
	});

	// VER DATOS DE ENTRENAMIENTO NORMALIZADOS
	$('#BtnViewDataNormalized').click(function(){
		$('#ModalFileName').html( NN.Training.FileName );
		$('#ModalText').html( ArrayToString( NN.Training.NormalizedData ) );
		$('#ModalText').trigger('autoresize');
		$('#ModalFile').modal('open');
	});

	// CREA UNA NUEVA RED
	function CreateNewNetwork(){
		NN.Network = FANN.create( NN.DefinitionArray );
		NN.Network.set_learning_rate( NN.LearningRate );
		NN.Network.set_learning_momentum( NN.LearningMomentum );
		NN.Network.set_activation_function_hidden( GetFunctionEnum( NN.ActivationFunction ) );
		NN.Network.set_activation_function_output( GetFunctionEnum( NN.ActivationFunction ) );

		NN.Training = new Object();
		NN.Training.IndexEpoch = 0;

		NN.Test = new Object();
	}

	// ASIGNA LA INFORMACION DE LA RED CREADA A LA TABLA DE LA INTERFAZ
	function InformationNetwork( InfoTraining ){

		if( InfoTraining == 1 ){
			$('.InfoTraining').show();
			SetHTML('InfoFileName', NN.Training.FileName);
			SetHTML('InfoTypeData', NN.Training.With);
		}else
			$('.InfoTraining').hide();

		SetHTML('InfoName', NN.Name);
		SetHTML('InfoDefinition', NN.Definition);
		SetHTML('InfoLearningRate', NN.LearningRate);
		SetHTML('InfoLearningMomentum', NN.LearningMomentum);
		SetHTML('InfoFunction', GetFunctionString(NN.ActivationFunction) );
		show('BoxNetworkInfo');
	}

	// EVALUA LOS CAMPOS [NOMBRE, DEFINICION, NUMERO, FUNCION] 
	function EvaluteTheField( Field, Type){

		if( Type == 'Name' )
			return ( Field != "" )? Field : ShowMessage("NOMBRE invalido!");

		if( Type == 'Definition')
			return ( Field != "" )? ArrayDefinition(Field) : ShowMessage("DEFINICION invalida!");

		if( Type == 'Number' )
			return ( Field != "" )? Number(Field) : ShowMessage("VALOR invalido!");

		if( Type == 'Function' )
			return ( Field != null )? GetFunctionEnum(Field) : ShowMessage("Elige una FUNCION!");

		if( (Type == 'FileNetwork' || Type == 'FileData') && !Field )
			return ShowMessage("Archivo Invalido!");
		
		if( Type == 'FileNetwork' )
			return ( /\.(ibm)/.test(Field.name) )? Field : ShowMessage("Archivo INVALIDO!");

		if( Type == 'FileData' )
			return ( /\.(txt)/.test(Field.name) )? Field : ShowMessage("Archivo INVALIDO!");
	}

	// DEVUELVE LA DEFINICION DE LA RED EN UN ARREGLO
	function ArrayDefinition( _String ){

		var _Array = _String.split(',');
		var Definition = new Array();

		for(var i=0; i < _Array.length; i++ )
			if( isNaN( Number( _Array[i] ) ) ){
				ShowMessage("DEFINICION incorrecta!");
				return -1;
			}
			else
				Definition[i] = Number( _Array[i] );

		return Definition;
	}

	// DEVUELVE UNA CADE DE TEXTO CON LOS DATOS DE ENTRENAMIENTO
	function ArrayToString( ArrayData ){

		var SubArray = "";
		var ArrayString = "";

		for(var i=0; i < ArrayData.length; i++){

			SubArray +=  Math.round( ArrayData[i][0][0] *1000 )/1000;
			for(var j=1; j < ArrayData[i][0].length; j++){
				SubArray += ",";
				SubArray +=  Math.round(ArrayData[i][0][j] *1000)/1000;
			}

			ArrayString += "<tr><td>" + SubArray + "</td>" + "<td>" + Math.round(ArrayData[i][1][0] *1000)/1000 + "</td></tr>";
			SubArray = "";
		}

		return ArrayString;
	}

	// CONVIERTE LOS VALORES DE UN ARRAY A STRING BASADO EN VALORES FLOTANTES
	function DoubleToString( ArrayData ){
		var ArrayString = "";

		ArrayString +=  Math.round(ArrayData[0] *1000)/1000;
		for(var i=1; i < ArrayData.length; i++){
			ArrayString += ",";
			ArrayString +=  Math.round(ArrayData[i] *1000)/1000;
		}
		
		ArrayString += '\n';

		return ArrayString;
	}

	// OBTIENE EL VALOR ASIGNADO AL TIPO DE FUNCION (TYPE: FANN)
	function GetFunctionEnum( ActivationFunction){
		switch( ActivationFunction ){
			case "LINEAR" 					  : return FANN.LINEAR;
			case "THRESHOLD" 				  : return FANN.THRESHOLD;
			case "THRESHOLD_SYMMETRIC" 		  : return FANN.THRESHOLD_SYMMETRIC;
			case "SIGMOID" 					  : return FANN.SIGMOID;
			case "SIGMOID_STEPWISE" 		  : return FANN.SIGMOID_STEPWISE;
			case "SIGMOID_SYMMETRIC" 		  : return FANN.SIGMOID_SYMMETRIC;
			case "SIGMOID_SYMMETRIC_STEPWISE" : return FANN.SIGMOID_SYMMETRIC_STEPWISE;
			case "GAUSSIAN" 				  : return FANN.GAUSSIAN;
			case "GAUSSIAN_SYMMETRIC" 		  : return FANN.GAUSSIAN_SYMMETRIC;
			case "GAUSSIAN_STEPWISE" 		  : return FANN.GAUSSIAN_STEPWISE;
			case "ELLIOT" 					  : return FANN.ELLIOT;
			case "ELLIOT_SYMMETRIC" 		  : return FANN.ELLIOT_SYMMETRIC;
			case "LINEAR_PIECE" 			  : return FANN.LINEAR_PIECE;
			case "LINEAR_PIECE_SYMMETRIC" 	  : return FANN.LINEAR_PIECE_SYMMETRIC;
			case "SIN_SYMMETRIC" 			  : return FANN.SIN_SYMMETRIC;
			case "COS_SYMMETRIC" 			  : return FANN.COS_SYMMETRIC;
			case "SIN" 						  : return FANN.SIN;
			case "COS" 						  : return FANN.COS;
		}
		return false;
	}
	
	// OBTIENE LA FUNCION EN FORMATO STRING
	function GetFunctionString( function_activation ){
		switch( function_activation ){
			case FANN.LINEAR 					 : return "LINEAR";
			case FANN.THRESHOLD 				 : return "THRESHOLD";
			case FANN.THRESHOLD_SYMMETRIC 		 : return "THRESHOLD_SYMMETRIC";
			case FANN.SIGMOID 					 : return "SIGMOID";
			case FANN.SIGMOID_STEPWISE 			 : return "SIGMOID_STEPWISE";
			case FANN.SIGMOID_SYMMETRIC 		 : return "SIGMOID_SYMMETRIC";
			case FANN.SIGMOID_SYMMETRIC_STEPWISE : return "SIGMOID_SYMMETRIC_STEPWISE";
			case FANN.GAUSSIAN 					 : return "GAUSSIAN";
			case FANN.GAUSSIAN_SYMMETRIC 		 : return "GAUSSIAN_SYMMETRIC";
			case FANN.GAUSSIAN_STEPWISE 		 : return "GAUSSIAN_STEPWISE";
			case FANN.ELLIOT 					 : return "ELLIOT";
			case FANN.ELLIOT_SYMMETRIC 			 : return "ELLIOT_SYMMETRIC";
			case FANN.LINEAR_PIECE 				 : return "LINEAR_PIECE";
			case FANN.LINEAR_PIECE_SYMMETRIC 	 : return "LINEAR_PIECE_SYMMETRIC";
			case FANN.SIN_SYMMETRIC 			 : return "SIN_SYMMETRIC";
			case FANN.COS_SYMMETRIC 			 : return "COS_SYMMETRIC";
			case FANN.SIN 						 : return "SIN";
			case FANN.COS 						 : return "COS";
		}
	}

	// GRAFICA CON LOS VALORES DE ERROR OBTENIDOS DURANTE EL ENTRENAMIENTO
	function SetHighchartsTraining(){
		Highcharts.chart('Graph', {

				title: {
					text: 'Error de la Red Neuronal ('+NN.Name+')'
				},
				xAxis: {
					tickInterval: 1,
					plotBands: [{
						from: RangeError(0),
						to: RangeError(1),
						color: 'rgba(191, 54, 12, .8)'
					}]
				},

				yAxis: {
					type: 'logarithmic',
					minorTickInterval: 0.1
				},

				tooltip: {
					headerFormat: '<b>{series.name}</b><br />',
					pointFormat: 'Epoca = {point.x}, Error = {point.y}'
				},

				series: [{
					name: '.',
					color: 'rgba(0, 150, 136, .5)',
					data: NN.Training.Results
				}]
			});

		show('BoxEraseTraining');

		function RangeError( index ){
			var i = 0;
			while( NN.Training.Results[i] > NN.Training.Error ) i++;
			if( index == 0 )
				return i-1;
			else
				return i;
		}
	}

	// GRAFICA CON LOS VALORES DE ERROR DURANTE LA EVALUACION
	function SetHighchartsEvaluation(){
		Highcharts.chart('GraphEvaluation', {

				title: {
					text: 'Validación Cruzada ('+NN.Name+')' 
				},

				xAxis: {
					tickInterval: 1,
				},

				yAxis: {
					type: 'logarithmic',
					minorTickInterval: 0.1,
					plotBands: [{
						from: NN.Test.PromError,
						to: NN.Test.PromError,
						color: 'rgba(191, 54, 12, .8)'
					}]
				},

				tooltip: {
					headerFormat: '<b>{series.name}</b><br />',
					pointFormat: 'Bloque = {point.x}, Error = {point.y}'
				},

				series: [{
					name: '.',
					color: 'rgba(0, 150, 136, .5)',
					data: NN.Test.Result
				}]
			});
	}

	// MUESTRA UN MENSAJE AL USUARIO
	function ShowMessage( Message ){
		Materialize.toast( Message , 4000 );
		return -1;
	}

	function SetHTML( TagID, HTML ){
		$('#'+TagID).html( HTML );
	}

	// MUEVE LA INTERFAZ AL TAB ESPECIFICADO
	function ShowTab( StringTab ){
		$('ul.tabs').tabs('select_tab', StringTab );
	}

	function isChecked( CheckboxID ){
		return $('#'+CheckboxID).prop('checked');
	}

	function show( TagID ){
		$('#'+TagID).show();
	}

	function hide( TagID ){
		$('#'+TagID).hide();
	}

});