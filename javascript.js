function match(guess, answers) {
  var retval = answers.indexOf(guess) >= 0;
  var tmp = guess.charAt(0).toLowerCase() + guess.slice(1);
  return retval || answers.indexOf(tmp) >= 0;
}

function atLeastOneTrue(array) {
  return array.reduce((p, v) => p || v);
}

// =======================================================

function UnitCheckbox(props) {
    var checkbox = React.createElement("input", {type:"checkbox"}, null);
    var iconType = props.checked ? "check" : "unchecked";
    var icon = React.createElement("span", {className: "glyphicon glyphicon-" + iconType + " mm-checkbox"});
    return React.createElement("label",
                               {className: "btn btn-default mm-btn-label",
                                onClick: props.onChange},
                               checkbox, icon, props.name);
}

function UnitSelect(props) {
  var labelArr = [];
  for (var i = 0; i < props.content.length; i++) {
    var name = props.content[i]['name'];
    const c = i;
    labelArr.push(React.createElement(UnitCheckbox, {name: name,
                                                     key: name,
                                                     checked: props.selections[i],
                                                     onChange: () => props.onChange(c)}));
  }
  return React.createElement("div",
                             {className:"btn-group-vertical btn-block",
                              'data-toggle':"buttons"},
                             labelArr);
}

function MainMenu(props) {
  var title = React.createElement("h2", {id: "title-hdr"},
                                  "Russian Vocabulary Study Buddy")
  var hdr = React.createElement("h4", {id: "inst-hdr"},
                                "Which vocabularies do you want to include?");
  var unitSel = React.createElement(UnitSelect,
                                    {selections: props.selections,
                                     content: props.content,
                                     onChange: props.onChange});
  var disabled = atLeastOneTrue(props.selections) ? "" : " disabled";
  var startBtn = React.createElement("button",
                                     {'id': "start-btn",
                                      'className':"btn btn-success btn-block" + disabled,
                                      'type':"submit",
                                      onClick: props.onStart},
                                     "Start");
  var startDiv = React.createElement("div", null, startBtn);
  return React.createElement("div", null, title, hdr, unitSel, startDiv);
}

// =========================================================

function addContent(eng, russ, unit, collection) {
  if (eng in collection) {
    if (collection[eng]['translation'].indexOf(russ) === -1)
      collection[eng]['translation'].push(russ);
    if (collection[eng]['reference'].indexOf(unit) === -1)
      collection[eng]['reference'].push(unit);
  } else {
    collection[eng] = {'translation': [russ], 'reference': [unit]};
  }
}

function mergeChosenContent(content) {
  var mergedContent = {};
  for (var u = 0; u < content.length; u++) {
    var unitCont = content[u]['vocab'];
    for (var i = 0; i < unitCont.length; i++) {
      var pair = unitCont[i];
      var engWord = unitCont[i][0];
      var rusWord = unitCont[i][1];
      addContent(engWord, rusWord, content[u]['name'], mergedContent);
    }
  }
  return $.map(mergedContent, function(val, key) {
    var retval = {'english': key};
    for (k in val) retval[k] = val[k];
    return retval;
  });
}

// =========================================================

var ProgressBar = React.createClass({
  displayName: 'ProgressBar',
  render: function() {
    var current = this.props.current;
    var total = this.props.total;
    var progressBar = React.createElement("div",
                                          {className: "progress-bar progress-bar-info",
                                           'role':"progressbar",
                                           'aria-valuenow':"60",
                                           'aria-valuemin':"0",
                                           'aria-valuemax':"100",
                                           'style':{'width': current/total*100 + "%",
                                                    'minWidth':"3em"}},
                                           current + "/" + total);
    return React.createElement("div", {className: "progress not-focused"}, progressBar);
  }
});

function Question(props) {
  var badge = React.createElement("span", {className: "label label-default q-word"}, props.word);
  var hdrWord = React.createElement("h1", {className: "word-hdr"}, badge);
  var hdrLabel = React.createElement("h2", {className: "lbl-hdr"}, "Translate");
  var synAlert = null;
  if (props.num > 1)
    synAlert = React.createElement("h4", {className: "syn-hdr"}, "There are " + props.num + " synonyms.");
  return React.createElement("div", {className: "text-center"}, hdrLabel, hdrWord, synAlert);
}

function InputSet(props) {
  var inputArr = [];
  for (var i = 0; i < props.num; i++) {
    const c = i;
    var value = "focus" + (i+1);
    var checked = props.selected === value;
    var radio = React.createElement("input",
                                    {type: "radio", 
                                     name: "text-focus", 
                                     value: value,
                                     'checked': checked,
                                     onChange: props.onRadioChange});
    var group = React.createElement("span",
                                    {className: "input-group-addon " + (checked ? "focused" : "not-focused"),
                                     onClick: () => props.onInputClick(c)}, 
                                    radio);
    var input = React.createElement("input",
                                    {type: "text",
                                     className: "form-control answer-box " + props.states[i],
                                     value: props.values[i],
                                     onChange: props.onInputChange[i],
                                     onClick: () => props.onInputClick(c)});
    inputArr.push(React.createElement("div", 
                                     {className: "input-group answer-div",
                                      key: i},
                                     group, input));
  }
  return React.createElement("div" , null, inputArr);
}

function KeyboardKey(props) {
  var cla = props.extraClass !== undefined ? props.extraClass : "soft-key";
  return React.createElement("input",
                             {className: "btn btn-default " + cla,
                              type: "button",
                              value: props.letter,
                              onClick: props.onKeyPress});
}

function BackspaceKey(props) {
  var iconSpan = React.createElement("span",
                                     {className: "glyphicon glyphicon-arrow-left",
                                      'aria-hidden': true});
  return React.createElement("button",
                             {className: "btn btn-default soft-key",
                              type: "button",
                              onClick: props.onKeyPress}, iconSpan);
}

function ShiftKey(props) {
  var iconSpan = React.createElement("span",
                                     {className: "glyphicon glyphicon-arrow-up",
                                      'aria-hidden': true});
  return React.createElement("button",
                             {className: "btn btn-default soft-key",
                              type: "button",
                              onClick: props.onShift}, iconSpan);
}

function Keyboard(props) {
  //var keysPerRow = [5, 6, 6, 5, 5, 6];
  //var keysPerRow = [5, 6, 6, 5, 5, 3, 3];
  var keysPerRow = [5, 6, 6, 6, 4, 6];
  var keys = [];
  var nextKey = 0;
  var rows = [];
  var bkspKey = React.createElement(BackspaceKey,
                                    {key: 0,
                                     onKeyPress: props.onKeyPress});
  var shiftKey = React.createElement(ShiftKey,
                                     {onShift: props.onShift,
                                      key: cyrilicAlphabet.length + 1});
  var spaceKey = React.createElement(KeyboardKey,
                                     { letter: " ",
                                       extraClass: "space-key",
                                       key: cyrilicAlphabet.length + 2,
                                       onKeyPress: props.onKeyPress});
  var qMarkKey = React.createElement(KeyboardKey,
                                     { letter: "?",
                                       key: cyrilicAlphabet.length + 3,
                                       onKeyPress: props.onKeyPress});
  for (var index in cyrilicAlphabet) {
    var letter = (props.uppercase ? 
                 cyrilicAlphabetUpper[index] :
                 cyrilicAlphabet[index])
    keys.push(React.createElement(KeyboardKey,
                                  {'letter': letter,
                                   key: index+1,
                                   onKeyPress: props.onKeyPress}));
  }
  for (var i = 0; i < keysPerRow.length; i++) {
    var keysForRow = keys.slice(nextKey, nextKey + keysPerRow[i]);
    if (i === 0) keysForRow.push(bkspKey);
    var row = React.createElement("div", {className: "text-center", key: "k" + i}, keysForRow);
    nextKey += keysPerRow[i];
    rows.push(row);
  }
  var last_row = React.createElement("div", {className: "text-center", key: "u"}, shiftKey, spaceKey, qMarkKey);
  rows.push(last_row);
  return React.createElement("div", {className: "panel panel-primary focused"}, rows);
}

function ItemList(props) {
  var arr = [];
  for (var i = 0; i < props.list.length; i++) {
    arr.push(React.createElement("li", {key: i}, props.list[i]));
  }
  return React.createElement("ul", null, arr);
}

function AnswerCollapse(props) {
  var answerList = React.createElement(ItemList, {list: props.list});
  var well = React.createElement("div", {className: "well"}, answerList);
  return React.createElement("div",
                             { className: "collapse",
                               id: "collapse-answer"},
                             well);
}

function HintModal(props) {
  var modalHdr = React.createElement("h4",
                                     { className: "modal-title",
                                       id: "hint-hdr"},
                                     "Hint");
  var closeBtnSpan = React.createElement("span",
                                         { className: "glyphicon glyphicon-remove",
                                           'aria-hidden': "true"});
  var closeBtn = React.createElement("button",
                                     { type: "button", className: "close",
                                       'data-dismiss': "modal",
                                       'aria-label': "Close"},
                                     closeBtnSpan);
  var modalHdrDiv = React.createElement("div",
                                        { className: "modal-header"},
                                        closeBtn, modalHdr);
  var hintList = React.createElement(ItemList, {list: props.content.reference});
  var hr = React.createElement("hr", null);
  var answerBtn = React.createElement("a",
                                   { className: "btn btn-primary",
                                     'role': "button",
                                     'data-toggle': "collapse",
                                     href: "#collapse-answer",
                                     'aria-expanded': "false",
                                     'aria-controls': "collapse-answer"},
                                   "I give up. What is it?");
  var answerColl = React.createElement(AnswerCollapse,
                                       {list: props.content.translation});
  var modalBody = React.createElement("div",
                                      { className: "modal-body"},
                                      "This word is in:",
                                      hintList, hr, answerBtn, answerColl);
  var modalCont = React.createElement("div", {className: "modal-content"}, modalHdrDiv, modalBody);
  var modalDiag = React.createElement("div",
                                      {className: "modal-dialog modal-sm",
                                       role: "document"}, modalCont);
  var modal = React.createElement("div",
                                  { id: "myModal",
                                    className: "modal fade",
                                    'tabIndex': "-1", role: "dialog",
                                    'aria-labelledby': "hint-hdr"},
                                  modalDiag);
  return modal;
};

function NavPane(props) {
  var hintBtn = React.createElement("input",
                                    {type: "button",
                                     value: "Hint",
                                     className: "btn btn-info hint-btn",
                                     'data-toggle': "modal",
                                     'data-target': "#myModal"});
  var skipBtn = React.createElement("input",
                                    {type: "button",
                                     value: "Skip",
                                     className: "btn btn-info skip-btn",
                                     onClick: props.onClick});
  var hintModal = React.createElement(HintModal, {content: props.content});
  return React.createElement("div", null, hintBtn, skipBtn, hintModal);
}

class Quiz extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      incompleteArr: props.content,
      completeArr: [],
      selectedRadio: 'focus1',
      inputValues: new Array(this.props.content[0]['translation'].length).fill(""),
      inputStates: new Array(this.props.content[0]['translation'].length).fill(""),
      uppercase: false,
      finished: false,
    }
    this.submit = this.submit.bind(this);
    this.handleRadio = this.handleRadio.bind(this);
  }

  getEngWord() {
    return this.state.incompleteArr[0]['english'];
  }

  getRusWords() {
    return this.state.incompleteArr[0]['translation'];
  }

  skipWord() {
    this.setState(function(prevState) {
      var tmp = prevState.incompleteArr[0];
      var iArr = prevState.incompleteArr.slice(1);
      iArr.push(tmp);
      return {
        incompleteArr: iArr,
        selectedRadio: 'focus1',
        inputValues: new Array(iArr[0]['translation'].length).fill(""),
        inputStates: new Array(iArr[0]['translation'].length).fill(""),
      };
    });
  }

  nextWord() { 
    this.setState(function(prevState) {
      var cArr = prevState.completeArr;
      cArr.push(prevState.incompleteArr[0]);
      var iArr = prevState.incompleteArr.slice(1);
      if (iArr.length === 0) return {finished: true};
      return { 
        completeArr: cArr,
        incompleteArr: iArr,
        selectedRadio: 'focus1',
        inputValues: new Array(iArr[0]['translation'].length).fill(""),
        inputStates: new Array(iArr[0]['translation'].length).fill(""),
      };
    });
  }

  handleRadio(changeEvent) {
    this.setState({ selectedRadio: changeEvent.target.value });
  }

  handleInput(i, changeEvent) {
    var newArr = this.state.inputValues;
    var newStates = this.state.inputStates;
    newArr[i] = changeEvent.target.value;
    newStates[i] = "";
    this.setState({ inputValues: newArr });
  }

  handleInputClick(i) {
    this.setState({ selectedRadio: "focus" + (i+1) });
  }

  handleSoftKeyPress(letter) {
    var inputIndex = this.state.selectedRadio.replace(/\D+/g, '') - 1;
    var newArr = this.state.inputValues;
    var newStates = this.state.inputStates;
    if (letter === "" || letter === undefined) newArr[inputIndex] = newArr[inputIndex].slice(0,-1);
    else newArr[inputIndex] += letter;
    newStates[inputIndex] = "";
    this.setState({inputValues: newArr,
                   inputStates: newStates,
                   uppercase: false,});
  }

  handleSoftShift() {
    this.setState(function(prevState) {
      return { uppercase: !prevState.uppercase }; });
  }

  makeInputFunctions() {
    var funcArr = [];
    var i = 0;
    for (i = 0; i < this.getRusWords().length; i++) {
      const x = i;
      funcArr.push((changeEvent) => this.handleInput(x, changeEvent));
    }
    return funcArr;
  }

  submit(e) {
    var correctAnswers = [];
    var russWords = this.getRusWords();
    var i = -1;
    var newStates = [];
    $(".answer-box").each(function(index) {
      i++;
      if (match(this.value, russWords)) {
        if (correctAnswers.indexOf(this.value) === -1) {
          correctAnswers.push(this.value);
          newStates.push("alert-success");
        }
        else {
          newStates.push("alert-danger");
        }
      } else {
          newStates.push("alert-danger");
      }
    });
    if (correctAnswers.length === russWords.length) this.nextWord();
    else this.setState({ inputStates: newStates });
    e.preventDefault();
  }

  renderGameOver() {
    var numDone = this.state.completeArr.length;
    var total = this.state.incompleteArr.length + numDone;
    var progress = React.createElement(ProgressBar,
                                       {current: total, total: total});
    return React.createElement("div", null, progress, "You Win!");
  }

  render() {
    if (this.state.finished) return this.renderGameOver();

    var numDone = this.state.completeArr.length;
    var total = this.state.incompleteArr.length + numDone;
    var progress = React.createElement(ProgressBar,
                                       {current: numDone, total: total});
    var nav = React.createElement(NavPane,
                                  { onClick: () => this.skipWord(),
                                    content: this.state.incompleteArr[0]});
    var currWord = React.createElement(Question, {word: this.getEngWord(),
                                                  num: this.getRusWords().length});
    var inputs = React.createElement(InputSet,
                                     {num: this.getRusWords().length,
                                      selected: this.state.selectedRadio,
                                      values: this.state.inputValues,
                                      states: this.state.inputStates,
                                      onRadioChange: this.handleRadio,
                                      onInputChange: this.makeInputFunctions(),
                                      onInputClick: (i) => this.handleInputClick(i)});
    var btn = React.createElement("button",
                                  {className: "btn btn-success submit-btn",
                                   type: "submit"},
                                  "Submit");
    var keyboard = React.createElement(Keyboard,
                                       {onKeyPress: (cEvent) => this.handleSoftKeyPress(cEvent.target.value),
                                        onShift: () => this.handleSoftShift(),
                                        uppercase: this.state.uppercase});
    var form = React.createElement("form", {onSubmit: (e) => this.submit(e)}, inputs, keyboard, btn);
    return React.createElement("div", null, progress, nav, currWord, form);
  }
}

// =======================================================================

class RussVocabApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      started: false,
      totalContent: russContent,
      selections: new Array(russContent.length).fill(false),
    };
  }

  handleCheckbox(i) {
    this.setState(function(prevState) {
      var newSelections = prevState.selections;
      newSelections[i] = !prevState.selections[i];
      return {selections: newSelections};
    });
  }

  onStart() {
    if (!atLeastOneTrue(this.state.selections)) return;
    this.setState({started: true});
  }

  render() {
    if (!this.state.started)
      return React.createElement(MainMenu,
                                 {selections: this.state.selections,
                                  content: this.state.totalContent,
                                  onChange: (i) => this.handleCheckbox(i),
                                  onStart: () => this.onStart()});
    else {
      var f = this.state.totalContent.filter((e, i) => this.state.selections[i]);
      var content = _.shuffle(mergeChosenContent(f));
      return React.createElement(Quiz, {content: content});
    }
  }
}

ReactDOM.render(
  React.createElement(RussVocabApp, null),
  document.getElementById('main-container')
);
