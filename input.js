import React, { Component } from 'react';
import Checkbox from '../../imgs/checkbox.png';
import CheckedCheckbox from '../../imgs/checked-checkbox.png';
import Collapse from 'react-collapse';
import Seta from '../../imgs/seta.png';

<COMMENT 1>
class IndicadorCheckboxes extends Component {
    constructor(props) {
        super(props);
        let checkboxValues = [];
        for (let i = 0; i < props.valores.length; i++)
            checkboxValues.push(false);
        this.state = {checkboxValues, collapse: false};
    }

    <COMMENT 2>
    componentWillReceiveProps(nextProps) {
        let checkboxValues = [];
        for (let i = 0; i < nextProps.valores.length; i++)
            checkboxValues.push(false);
        this.setState({checkboxValues});
    }

    <COMMENT 3>
    forbiddenFilterSet(selFilters, unfiltrable) {
        let retVal = false;
        selFilters.forEach((selFil)=> {
            if (selFil.name === unfiltrable)
                retVal = true;
        })
        return retVal;
    }

    <COMMENT 4>
    render() {
        let disabled = false;
        let temp = this.props.valores.filter((valor) => {
            return valor.id !== null;
        }).map((valor, i) => {
            return {
                value: valor.id+'',
                label: (valor.name) ? valor.name : valor.id
            };
        });

        let valores = [];
        
        if (this.props.unfiltrable === undefined || this.props.unfiltrable !== true)
            valores.push(...temp);
        else
            disabled = true;

        // if (typeof this.props.unfiltrable === "undefined" || !this.forbiddenFilterSet(this.props.selectedFilters, this.props.unfiltrable))
        //     valores.push(...temp);
        // else
        //     disabled = false;

        <COMMENT 5>
        let searchFilter = this.props.selectedFilters.find((filter) => {
           if (this.props.placeholder == filter.humanName) return true;
           else return false;
        });
        if (typeof searchFilter !== 'undefined') {
             for (let i = 0; i < searchFilter.label.length; i++) {
                 let checkboxId = 0;
                 for (checkboxId = 0; checkboxId < this.props.valores.length; checkboxId++) {
                     //console.log(searchFilter.label[i] + " == " + this.props.valores[checkboxId].name);
                     if (searchFilter.label[i] == this.props.valores[checkboxId].name) {
                         let searchNullElement = this.props.valores.find((filter) => {
                            if (filter.id == null) return true;
                            else return false;
                         })
                         <COMMENT 6>
                         if (typeof searchNullElement === 'undefined') {
                             this.state.checkboxValues[checkboxId]=true;
                         }

                         <COMMENT 7>
                         else {
                             this.state.checkboxValues[checkboxId-1]=true;
                         }
                         break;
                     }
                 }
             }
          }

        <COMMENT 8>
        return (!disabled &&
            <div className="col-md-12 check-container">
                <div className={this.props.disabled || disabled ? "filter-checkbox-head disabled" : "filter-checkbox-head cursor-pointer"} onClick={()=> {this.setState({collapse: !this.state.collapse})}}>
                    <span>{this.props.placeholder}</span>
                    <img src={Seta} className={this.state.collapse ? "right-float expanded" : "right-float"}/>
                </div>
                <Collapse isOpened={this.state.collapse}>
                    <div className="filter-checkboxes">
                        {valores.map((item, i) => {

                            let str = "filter-checkbox";
                            if (this.state.checkboxValues[i])
                                str += " checked";
                            if (i == 0)
                                str += " first-filter-checkbox";
                            return (
                                <div key={i} className={str}>
                                    <img src={this.state.checkboxValues[i] ? CheckedCheckbox : Checkbox} onClick={() => {
                                            let newValue = [];
                                            for (let j = 0; j < this.state.checkboxValues.length; j++)
                                                if (i != j)
                                                    newValue.push(this.state.checkboxValues[j])
                                                else
                                                    newValue.push(!this.state.checkboxValues[j]);
                                            this.setState({checkboxValues: newValue});

                                            let val = [];
                                            for (let j = 0; j < newValue.length; j++)
                                                if (newValue[j])
                                                    val.push(valores[j]);
                                            this.props.onChange(val);
                                    }}/>
                                    {item.label}
                                </div>
                        )})}
                    </div>
                </Collapse>
            </div>
        )
    }
}

export default IndicadorCheckboxes;
