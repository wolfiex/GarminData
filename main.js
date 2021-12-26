const electron = require('electron');

require('electron-reload')(__dirname);


var args = process.argv.slice(2);


const app = electron.app; // Module to control application life.
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
var mainWindow = null;

var initSqlJs = require("sql.js");

var SQL, db
const fs = require('fs');



app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function () {
  const myLocation = 'file://' + __dirname
  mainWindow = new BrowserWindow({
    width: 200,
    height: 200,
    x: 0,
    y: 0,
    resizable: true,
    title: 'Dan Ellis 2016',
    webPreferences: {
      nodeIntegration: true
    },
    show: true
  });
  mainWindow.openDevTools(); // and load the index.html of the app.
  mainWindow.loadURL('https://connect.garmin.com/modern/daily-summary/2021-12-25')





  const fn = './test.sqlite';
  var newf = false;
  initSqlJs({
    locateFile: file => `./sql-wasm.wasm`
  }).then(SQL => {

   

    try {
      var filebuffer = new Uint8Array(fs.readFileSync(fn));
        db = new SQL.Database(filebuffer);
        
      }catch (e){
        db = new SQL.Database();
        console.log('NEW NEW NEW NEW NEW NEW NEW')
        newf = true
      }

    return db
    /// ONCE WE HAVE A DB GET DATA FROM GARMIN
  }).then(async db => {

    
    // console.log('db', db)
    db.run("CREATE TABLE IF NOT EXISTS pdates (dt int);");


    // console.log('pppp', db.exec("SELECT * FROM activity")[0].values,db.exec("SELECT date FROM pdates ORDER BY date DESC LIMIT 1")[0])//,await db.exec("SELECT * FROM activity"))


    // console.log('pppp', db.exec("SELECT * FROM stress")[0],db.exec("SELECT date FROM pdates ORDER BY date DESC LIMIT 1")[0])//,await db.exec("SELECT * FROM activity"))

    var startdate ;
    console.log(newf)
    if (newf) {startdate = '2021-12-24'} else {startdate = db.exec("SELECT dt FROM pdates ORDER BY dt DESC LIMIT 1;")[0].values[0][0]}

    console.log('eestartdate', new Date(startdate).valueOf(),startdate,new Date(startdate))
    var daylist = getDaysArray(new Date(startdate), new Date());
    daylist = daylist.map((v) => v.toISOString().slice(0, 10)) //.join("")
    console.log(daylist, start)
    if (!daylist.length) return 0

    // daylist.forEach( (day) => {
    for (let i = 0; i < daylist.length; i++) {
      var day = daylist[i]
      console.log(day)

        var result;

      // HR DATA
       db.run("CREATE TABLE IF NOT EXISTS hr (datetime int, beats int);");
       results = await mainWindow.webContents.executeJavaScript(`
    fetch('https://connect.garmin.com/proxy/wellness-service/wellness/dailyHeartRate/8089ab6a-4a8b-4cca-9254-495979641bb0?date=${day}').then(d=>d.json())`)
    // console.log('hr',results)
    var items = results['heartRateValues']
    if (!items) continue
    for (let j = 0; j < items.length; j++) {
            db.run("INSERT INTO hr VALUES (?,?)", items[j]);
          };




      //stress DATA
      db.run("CREATE TABLE IF NOT EXISTS stress (datetime int, beats int);");
      results = await  mainWindow.webContents.executeJavaScript(`
    fetch('https://connect.garmin.com/proxy/wellness-service/wellness/dailyStress/${day}').then(d=>d.json())`)
    // console.log(results)
    var items = results['stressValuesArray']
    for (let j = 0; j < items.length; j++) {
      db.run("INSERT INTO stress VALUES (?,?)", items[j]);
          };



      //activity DATA
       db.run("CREATE TABLE IF NOT EXISTS activity (start int, end int,calories int, duration int, distance int);");
       results = await mainWindow.webContents.executeJavaScript(`
    fetch('https://connect.garmin.com/proxy/activitylist-service/activities/fordailysummary/8089ab6a-4a8b-4cca-9254-495979641bb0?calendarDate=${day}').then(d=>d.json())
 `)
 

//  var stmt = db.prepare("SELECT * FROM activity WHERE start=:start AND end=:ebd AND calories=:calories AND duration=:duration AND distance=:distance");

// Bind values to the parameters and fetch the results of the query
// const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});
 for (let j = 0; j < results.length; j++) {
   var ac = results[j];
   var start = new Date(ac.startTimeGMT).valueOf()
   var entry = [start, start + ac.duration, parseInt(ac.bmrCalories), parseInt(ac.duration), parseInt(ac.distance)]

  //  stmt.getAsObject({':start' : start, ':ebd' : start + ac.duration, ':calories' : parseInt(ac.bmrCalories), ':duration' : parseInt(ac.duration), ':distance' : parseInt(ac.distance)});
   db.run("INSERT INTO activity VALUES (?,?,?,?,?)", entry);
  };



      var datenum = new Date(day).valueOf()
      db.run(`INSERT INTO pdates (dt) VALUES (${parseInt(datenum)})`);
      // db.exec("SELECT * FROM pdates")
      console.log('end', day)
    }

  //  console.log(db.exec("SELECT * FROM pdates")[0].values.map(d=>+d))


    const data = db.export();
    // console.log(db,data)
    const buffer = new Buffer.from(data);
    
    console.log('wrote', fn)
    await fs.writeFileSync(fn, buffer);

  }).then(e=>{
    

    app.quit()
  })

  mainWindow.on('closed', function () {
    mainWindow = null;
    app.quit();
  });


})
///pdf

// import the following to deal with pdf


// <script src="sql.js"></script>
// <script>
//     function loadBinaryFile(path,success) {
//         var xhr = new XMLHttpRequest();
//         xhr.open("GET", path, true); 
//         xhr.responseType = "arraybuffer";
//         xhr.onload = function() {
//             var data = new Uint8Array(xhr.response);
//             var arr = new Array();
//             for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
//             success(arr.join(""));
//         };
//         xhr.send();
//     };

//     loadBinaryFile('./Chinook_Sqlite.sqlite', function(data){
//         var sqldb = new SQL.Database(data);
//         // Database is ready
//         var res = db.exec("SELECT * FROM Genre");
//     });
// </script>



// db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

//     // Prepare a statement
//     var stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
//     stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

//     // Bind new values
//     stmt.bind({$start:1, $end:2});
//     while(stmt.step()) { //
//         var row = stmt.getAsObject();
//         // [...] do something with the row of result
//     }



var getDaysArray = function (start, end) {
  console.log('getDaysArray', start.toDateString(), end.toDateString()) 
  for (var arr = [], dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  if (start.toDateString() === end.toDateString()) arr= []
  return arr;
};