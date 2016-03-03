/// <reference path="../../node.d.ts" />

"use strict";

require('./ProtoUtil');
var CsvSerieUtil = require('./CsvSerieUtil');
var util = new CsvSerieUtil(true);

var idx = ["801001", "801002", "801003", "801005", "801010", "801020", "801030", "801040", "801050", "801060", "801070", "801080", "801090", "801100", "801110", "801120", "801130", "801140", "801150", "801160", "801170", "801180", "801190", "801200", "801210", "801220", "801230", "801250", "801260", "801270", "801280", "801300", "801710", "801720", "801730", "801740", "801750", "801760", "801770", "801780", "801790", "801811", "801812", "801813", "801821", "801822", "801823", "801831", "801832", "801833", "801841", "801842", "801843", "801851", "801852", "801853", "801861", "801862", "801863", "801880", "801890", "801901", "801903", "801905", "802600", "802611", "802612", "802613", "803611", "803612", "803613", "805001", "805002", "805003", "805004", "805005", "805006", "805007", "805008", "806001", "806010", "806020", "806030"];

idx.forEach((it)=>{
	// var it = '801790';
	util.extract('./{0}.csv'.format(it), '../../daodao10.github.io/chart/dao/{0}.json'.format(it));
});
