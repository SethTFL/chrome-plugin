var dqs = s => document.querySelector(s);
var dqa = s => document.querySelectorAll(s);
var dce = s => document.createElement(s);
var H = (inNode, inProps, inChildren) =>
{
    var i;
    var element = document.createElement(inNode);
    var propKey, propValue;
    var styleKey, styleValue;
    if(inProps)
    {
        for(var propKey in inProps)
        {
            propValue = inProps[propKey];
            switch(propKey)
            {
                case "ref" :
                    this[propValue] = element;
                    break;
                case "style" :
                    for(styleKey in propValue)
                    {
                        styleValue = propValue[styleKey];
                        element.style[styleKey] = styleValue;
                    }
                    break;
                case "class" :
                    element.className = propValue;
                    break;
                default:
                    element[propKey] = propValue;
            }
        }
    }
    switch(typeof inChildren)
    {
        case "string" :
            element.innerHTML = inChildren;
            break;
        case "object" :
            for(i=0; i<inChildren.length; i++)
            {
                element.append(inChildren[i]);
            }
            break;
    }
    return element;
};

/***********************************/
var FindDate = (inSelect, inDateString) =>
{
    var i;
    var child;
    var index;
    var name;
    var date;

    for(i=0; i<inSelect.children.length; i++)
    {
        child = inSelect.children[i];
        name = child.textContent;
        index = name.lastIndexOf("(");
        date = name.substring(index+1, name.length-1);
        if(date == inDateString)
        {
            inSelect.value = child.value;
            inSelect.dispatchEvent(new Event("change"));
            return {Name:name.substring(0, index-1), ID:child.value};
        }
        if( i > 1000 )
        {
            alert("could not find content for", inDateString);
            return false;
        }
    }
    return false;
};
var FetchQuery = (inURL, inSelector) =>
{
    var dom = new DOMParser();
    return fetch(inURL)
    .then( r=>r.text() )
    .then(
        t => dom.parseFromString(t, "text/html").querySelector(inSelector),
        e => console.log("error handler", e)
    );
};
var DateMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var DateDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var DateOffset = inShift => {
    date = new Date();
    date.setDate(new Date().getDate()+inShift);
    date.setHours(0,0,0,0);
    return date;
};
var DatePad = inNumber => (inNumber < 10) ? "0"+inNumber : ""+inNumber;
var DateLong = inDate => [inDate.getFullYear(), DatePad(inDate.getMonth()+1), DatePad(inDate.getDate())].join("-");
var DateShort = inDate =>
{
    return DateMonths[inDate.getMonth()]+" "+inDate.getDate();
};
var Apply = inState =>
{
    var dateCurrentShort = DateShort(inState.Date);
    var dateCurrentLong = DateLong(inState.Date);

    var dateNextLong = new Date();
    dateNextLong.setDate(inState.Date.getDate()+1);
    dateNextLong = DateLong(dateNextLong);

    //feed track
    dqs("#id_track_1").checked = true;

    // publish on
    dqs("#id_publish_on_0").value = dateCurrentLong;
    dqs("#id_publish_on_1").value = "02:50:00";
    //unpublish on
    dqs("#id_unpublish_on_0").value = dateNextLong;
    dqs("#id_unpublish_on_1").value = "03:00:00";

    //published
    dqs("#id_published").checked = true;

    //link type
    dqs("#id_link_type").value = inState.Type;
    dqs("#id_link_type").dispatchEvent(new Event("change"));

    var match;
    var inputTitle = dqs("#id_title");
    var inputImage = dqs("#id_image");
    
    switch(inState.Type)
    {
        case "sermon" :
            match = FindDate(dqs("select.sermon_val"), dateCurrentLong);
            if(match)
            {
                inputTitle.value = match.Name;
                inputImage.value = "finding image...";

                FetchQuery("/admin/fiveq_resource_library/message/"+match.ID, "#id_image")
                .then( el =>
                {
                    inputImage.value = el.value;
                    formImage.src = inputImage.value;
                });
            }
            break;

        case "program" :
            dqs("#id_order").value = "6";
            match = FindDate(dqs("select.program_val"), dateCurrentLong);
            if(match)
            {
                inputTitle.value = match.Name;
                inputImage.value = "finding image...";
                FetchQuery("/admin/broadcasts/broadcast/"+match.ID, "#id_img")
                .then( el =>
                {
                    inputImage.value = el.value;
                    formImage.src = inputImage.value;
                });
            }
            break;

        case "devotion" :
            dqs("#id_order").value = "7";
            match = FindDate(dqs("select.devotion_val"), dateCurrentShort);
            if(match)
            {
                inputTitle.value = match.Name;
                inputImage.value = "finding image...";
                FetchQuery("/admin/fiveq_366_daily_devotional/dailydevotional/"+match.ID, "p a")
                .then( el =>
                {
                    inputImage.value = el.getAttribute("href");
                    formImage.src = inputImage.value;
                });
            }
            break;
        
        case "bible" :
            dqs("#id_order").value = "8";
            
            var thumb = "/static/uploads/explore/Feb-"+inState.Date.getDate()+"-Scripture.jpg";
            inputImage.value = thumb;
            formImage.src = thumb;

            var passage = inputTitle.value;
            var indexBook = passage.lastIndexOf(" ");
            var indexVerse = passage.indexOf(":");

            var partBook = passage.substring(0, indexBook);
            var partChapter = passage.substring(indexBook+1, indexVerse);
            var partVerse = passage.substring(indexVerse+1).replace("—", "-");

            dqs("#bible_ref_book").value = partBook;
            dqs("#bible_ref_book").dispatchEvent(new Event("change"));
            dqs("#bible_ref_chapter").value = partChapter;
            dqs("#bible_ref_chapter").dispatchEvent(new Event("change"));
            dqs("#bible_ref_verse").value = partVerse;
            dqs("#bible_ref_verse").dispatchEvent(new Event("change"));

            break;
    }

};

/*********************************************************/
if(document.title.indexOf("Change Explore Feed") != -1 || document.title.indexOf("Add Explore Feed") != -1)
{
    var dates = [DateOffset(0), DateOffset(1), DateOffset(2), DateOffset(3), DateOffset(4), DateOffset(5), DateOffset(6), DateOffset(7)];
    var types = ["program", "devotion", "bible", "sermon"];
    dqs("#content").prepend(

        H("div", false, [
            H("select", {ref:"formDate"}, dates.map(  d => H("option", {value:d}, DateDays[d.getDay()]+" "+d.getDate())  )),
            H("select", {ref:"formType"}, types.map(  t => H("option", {value:t}, t)  )),
            H("button", {onclick:inEvent=>{
                Apply({
                    Date:new Date(formDate.value),
                    Type:formType.value});
            }}, "Autofill"),
            H("img", {ref:"formImage"})
        ])
    );
}


/*******************************/
var FixDateString = inString =>
{
    var split;
    inString = inString.replace(" a.m.", " AM").replace(" p.m.", " PM");
    if(inString.indexOf(":") == -1)
    {
        split = inString.lastIndexOf(" ");
        inString = inString.substring(0, split)+":00"+inString.substring(split);
    }
    return inString;
};
var FixOrderString = inString =>
{
    var Orders = {
        "First":0,
        "Second":1,
        "Third":2,
        "Fourth":3,
        "Fifth":4,
        "Sixth":5,
        "Seventh":6,
        "Eighth":7,
        "Ninth":8,
        "Tenth":9,
    };
    return Orders[inString];
};
var DataBuild = inRows =>
{
    var output = [];
    var i, item;

    for(i=0; i<inRows.length; i++)
    {
        item = inRows[i].children;
        output.push({
            DOM:item,
            Index:i,
            Featured:item[3].textContent.indexOf("Featured") != -1,
            Order:FixOrderString(item[2].textContent),
            Link:item[1].children[0].href,
            Name:item[1].children[0].textContent,
            Start:new Date(FixDateString(item[5].textContent)),
            Stop:new Date(FixDateString(item[6].textContent)),
            Active:item[4].innerHTML.indexOf("True") != -1
        });
    }

    return output;
};
var DataRange = (dateStart, dateStop, inData) =>
{
    var dateStart, dateStop, dateRange;
    var output = [];
    var i, item;

    dateRange = dateStop-dateStart;

    for(i=0; i<inData.length; i++)
    {
        item = inData[i];
        if(item.Start <= dateStop && item.Stop >= dateStart)
        {
            output.push(item);
            item.CSSLeft = (item.Start - dateStart)/dateRange * 100;
            item.CSSWidth = (item.Stop - item.Start)/dateRange * 100;

            {
                let pointer = item;
                FetchQuery(pointer.Link, "#id_image").then(input=>pointer.Image = input.value);
            }
            
        }
    }
    return output;
};
var DataCatalog = inList =>
{
    var output = {
        Featured:[[], [], [], [], [], [], [], [], [], []],
             New:[[], [], [], [], [], [], [], [], [], []]
    };

    var list;
    var i, item;
    for(i=0; i<inList.length; i++)
    {
        item = inList[i];
        list = item.Featured ? output.Featured : output.New;
        list[item.Order].unshift(item);
    }

    return output;
}

/*********************************************************/
var i;
var rangeMin = -1;
var rangeMax = 5;
var rangeDays = [];
for(i=rangeMin; i<rangeMax; i++)
{
    rangeDays.push(DateOffset(i));
}

var db = DataBuild(dqa("#result_list tbody tr"));
var dbSelection = DataRange(rangeDays[0], rangeDays[rangeDays.length-1], db);
var dbCatalog = DataCatalog(dbSelection);

var domColumns = [];
var domRows = [];

var fraction = 1/(rangeDays.length-1);
for(i=0; i<rangeDays.length-1; i++)
{
    var cssSection = {
        position:"absolute",
        left:fraction*100*i + "%",
        width:fraction*100 + "%",
        height:"100%",
        boxSizing:"border-box",
        border:"1px dashed black"
    };
    var cssLabel = {
        position:"absolute",
        top:"-30px",
        width:"100%",
        height:"30px",

    };
    domColumns.push(H("div", {style:cssSection}, [ 
        H("div", {style:cssLabel}, DateDays[rangeDays[i].getDay()])
    ]));
}

var RenderEvent = item =>
{
    return H("div", {class:"Item", style:{position:"relative", overflow:"hidden", boxSizing:"border-box", margin:"0"}}, [
        H("div", {class:"Bar", style:{
            position:"absolute",
            left:item.CSSLeft+"%",
            width:item.CSSWidth+"%",
            height:"100%",
            boxSizing:"border-box",
            borderRadius:"5px",
            border:"1px solid gray",
            background:item.Active ? "orange" : "gray",
            opacity:0.8
        }}, ""),
        H("div", {class:"Label", style:{position:"relative", padding:"3px"}}, item.Name)
    ]);
};
var RenderBreakdown = (order, index, array) =>
{
    var cssOrder = {
        display: order.length == 0 ? "none" : "block",
        position:"relative"
    };
    var cssFill = {
        position:"absolute",
        top:"0",
        left:"0",
        width:"100%",
        height:"100%",
        boxSizing:"border-box",
        border:"1px solid black",
    };
    var cssLabel = {
        position:"absolute",
        top:"0px",
        left:"-100px",
        width:"100px",
        height:"100%",
    };

    return H("div", {class:"Order", style:cssOrder}, [
        H("div", {style:cssFill}, [
            H("div", {style:cssLabel}, "Order "+(index+1))
        ]),
        ...order.map(RenderEvent)
    ]);
};

var HandleOld = inEvent =>
{
    var time = new Date();
    var event = new Event("click");
    var i, item;
    for(i=0; i<db.length; i++)
    {
        item = db[i];
        if(item.Stop < time)
        {
            item.DOM[0].children[0].click(event);
        }
    }
}

var HandleSample = inEvent =>
{
    var rect = inEvent.currentTarget.getBoundingClientRect();
    var percent = (inEvent.clientX - rect.left)/rect.width;

    var timeStart = rangeDays[0].getTime();
    var timeStop = rangeDays[rangeDays.length-1].getTime();
    var timeSample = new Date(timeStart + (timeStop - timeStart)*percent);

    var i, j;
    var order, item;
    var matches = [];

    while(samplePanels.hasChildNodes())
    {
        samplePanels.removeChild(samplePanels.firstChild);
    }
    sampleLine.style.left = percent*100 + "%";

    for(i=0; i<dbCatalog.Featured.length; i++)
    {
        order = dbCatalog.Featured[i];
        for(j=0; j<order.length; j++)
        {
            item = order[j];
            if(item.Active)
            {
                if(item.Start <= timeSample && item.Stop >= timeSample)
                {
                    matches.push(item);
                    samplePanels.append(
                        H("div", {style:{
                                margin:"5px",
                                padding:"5px",
                                borderRadius:"5px",
                                background:"#eee"
                            }},
                            [
                                H("a", {href:item.Link, target:"_blank"}, (i+1)+" "+item.Name),
                                H("img", {src:item.Image, style:{
                                    display:"block",
                                    width:"100%",
                                    height:"auto",
                                    marginTop:"8px"
                                }})
                            ]
                        )
                    )
                }
            }
        }
    }
};

if(document.title.indexOf("Select Explore Feed to change") != -1)
{
    dqs("#content").prepend(
        H("div", {ref:"samplePanels", style:{display:"flex"}}, []),
        H("div", {style:{position:"relative", margin:"50px 1em 1em 100px"}}, [
            H("div", {style:{position:"absolute", width:"100%", height:"100%"}, onclick:HandleSample}, domColumns),
            H("div", false, dbCatalog.Featured.map(RenderBreakdown)),
            H("div", {ref:"sampleLine", style:{position:"absolute", left:"0%", top:"-5%", width:"2px", height:"105%", background:"red"}})
        ]),
        H("button", {onclick:HandleOld}, "select exired events")
    );
}