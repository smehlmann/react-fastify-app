import React, { Component } from 'react';
import './App.css';
import { CSVLink } from 'react-csv';

class App extends Component {

  /* class Constructor sets state */
  constructor(props) {
    super(props);
    this.state = {
      apiResponse: "",
      fileData: "",
      report: '',
      disabled: true,
      fileName: "",
      output: "",
      emassNums: "",
      showEmassNum: false
    };

    //const formName = useRef(null);
    this.onRadioChange = this.onRadioChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    //this.showComponent = this.showComponent.bind(this);


    this.handleFileNameChange = (e) => {
      //console.log("In handlefileNameChange");
      // console.log(e.target);
      if (e.target.value.length > 3) {
        //console.log("set disabled to false");
        this.setState({
          disabled: false,
          fileName: e.target.value
        });
      }
      else {
        this.setState({
          disabled: true
        });
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.apiResponse !== this.state.apiResponse) {
      console.log('apiResponse has changed.');
      this.setState({
        fileData: this.state.apiResponse
      });

      if (this.state.apiResponse.length > 0) {
        alert('Report is ready to save. Use the "Download report" link below to save the report.');
      }
    }
  }

  callAPI(reportNum) {
    try {
      //alert('in callApi for report: ' + reportNum);
      var emassNum = this.state.emassNums;
      var url = "http://localhost:5000?reportNum=" + reportNum;
      if (emassNum && emassNum.length > 0) {
        url = url + "&emassNum=" + this.state.emassNums;
      }
      //alert(url);
      //console.log('url: ' + url);
      fetch(url)
        .then(res => res.text())
        //.then(res => this.setState({ apiResponse: res })
        .then(res => this.setState({ apiResponse: res }))
    } catch (e) {
      alert("Request failed. " + e.message);
    }
  }

  //componentDidMount() {
  /*  componentDidMount() {
      console.log('Calling componentDidMount');
      this.callAPI();
    }
  */

  onRadioChange = (e) => {
    this.setState({
      report: e.target.value,
      disabled: false
    });
    console.log("setting show");
    this.setState({
      showEmassNum: true
    });
    console.log(this.state.emassNums);
  }

  onSubmit = (e) => {
    e.preventDefault();
    if (this.state.report.length === 0) {
      alert('Please select a report to generate.');
      return;
    }
    console.log(this.state);
    if (this.state.report)
      this.callAPI(this.state.report);
  }

  updateEmass(evt) {
    const val = evt.target.value;
    this.setState({
      emassNums: val
    });
  }

  /* showComponent() {
 
     this.setState({
       showEmassNum: true
     });
   }*/

  LoadingSpinner() {
    return (
      <div className="spinner-container">
        <div className="loading-spinner">
        </div>
      </div>
    );
  }

  render() {
    const showEmassNum = this.state.showEmassNum;
    return (
      <div className="App">
        <div className="title-div">
          <strong className="title">Select Report</strong>
        </div>
        <div className="radio-btn-container-div">
          <form className="app-form" onSubmit={this.onSubmit}>
            <label>
              <input
                type="radio"
                value="1"
                checked={this.state.report === "1"}
                onChange={this.onRadioChange}
              />
              <span>1. RMF SAP Report</span>
            </label>
            <br />
            <label>
              <input
                type="radio"
                value="2"
                checked={this.state.report === "2"}
                onChange={this.onRadioChange}
              />
              <span>2. STIG Status per Collection</span>
            </label>
            <br />
            <label>
              <input
                type="radio"
                value="4"
                checked={this.state.report === "4"}
                onChange={this.onRadioChange}
              />
              <span>3. Asset Status per Collection</span>
            </label>
            <br />
            <label>
              <input
                type="radio"
                value="5"
                checked={this.state.report === "5"}
                onChange={this.onRadioChange}
              />
              <span>4. Asset Collection per Primary Owner and System Admin</span>
            </label>
            <br />
            <label>
              <input
                type="radio"
                value="7"
                checked={this.state.report === "7"}
                onChange={this.onRadioChange}
              />
              <span>5. </span>Asset Status per eMASS
            </label>
            <br />
            <label>
              <input
                type="radio"
                value="8"
                checked={this.state.report === "8"}
                onChange={this.onRadioChange}
              />
              <span>6. STIG Deltas per Primary Owner and System Admin</span>
            </label>
            <br /><br />
            {showEmassNum && (
              <div id='emassDiv'>
                <label htmlFor="emassNumsText">Optional: Enter EMASS Numbers: </label>
                <input
                  id='emassNumsText'
                  type='text'
                  value={this.state.emassNums}
                  onChange={evt => this.updateEmass(evt)}
                />
              </div>
            )}
            <br />
            <button className="submit-btn" type="submit" disabled={this.state.disabled}>Run Report</button>
            <br /><br />
            <div id="csv-ink-div">
              <CSVLink
                data={this.state.fileData}
                onClick={() => {
                  window.location.reload();
                }}
              >Download report.</CSVLink>
            </div>
          </form>
        </div>
      </div >
    );
  }
}

export default App;
