/*
Copyright (C) 2016 Centro de Computacao Cientifica e Software Livre
Departamento de Informatica - Universidade Federal do Parana - C3SL/UFPR

This file is part of labdados-ui.

labdados-ui is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

labdados-ui is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with labdados-ui.  If not, see <https://www.gnu.org/licenses/>.
*/
import React, { Component } from 'react';
import { createBrowserHistory } from 'history';
import IndicadorDropdown from './IndicadorDropdown';
import IndicadorSelect from './IndicadorSelect';
import AnoSelect from './AnoSelect';
import { addFilter, addMultiFilter, removeFilter, resetFilters, getIndicatorResult, addLineResult, addColResult, removeLineResult, removeColResult } from '../../actions/actionCreators';
import ListaFiltrosFooter from './ListaFiltrosFooter';
import ConsultaFooter from './ConsultaFooter';
import IndicadorCheckboxes from './IndicadorCheckboxes';
import Login from '../login/LoginComponent';


let browserHistory = createBrowserHistory()

const SPECIFIC = true;
const RANGE = false;
const CLEAR = 1;
const OPEN = 2;
const SHADED = 3;

const forbiddenFilters = [
    'region',
    'state',
    'school',
    'university',
    'uni_offer_aggregate',
    'universityLocalOffer',
    'min_year',
    'max_year'
]

function sort(prop = 'id') {
    return (a, b) => {
        if (a[prop] > b[prop]) {
            return 1;
        }
        if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
}

function getFilterValue(name, component) {
    let option = component.props.indicador.selectedFilters.find((f) => f.name === name);
    return (typeof option !== 'undefined') ? option.value : option;
}

class ListaFiltro extends Component {
    constructor(props) {
        super(props);
        this.state = {
            yearType: SPECIFIC,
            firstDispatch: true,
            stepsStatus: [CLEAR, CLEAR, CLEAR, CLEAR]
        };
    }

    componentDidMount() {
        this.backListener = browserHistory.listen(location => {
            const univ = (this.props.indicador.universityAggregate) ? 'uni_offer_aggregate' : 
            ((this.props.indicador.universityFilter) ? 'university' : 'universityLocalOffer');

            if (location.action === "POP") {
                this.props.indicador.selectedFilters.forEach((f) => {
                    if (f.name == 'region' || f.name == 'state' || f.name == 'city' || f.name == 'school' || f.name == univ) {
                        this.props.dispatch(removeFilter(this.props.indicador, f.name));
                    }
                });
                this.props.dispatch(removeLineResult(this.props.indicador, this.props.indicador.selectedResults[0]));
                this.props.dispatch(removeColResult(this.props.indicador, this.props.indicador.selectedResults[1]));
                this.setState({ stepsStatus: [CLEAR, CLEAR, CLEAR, CLEAR] });

                this.props.indicador.selectedFilters.forEach((f) => {
                    if (f.name !== 'min_year' && f.name !== 'max_year' && f.name !== 'region' && f.name !== 'state' && f.name !== 'city' && f.name !== 'school' && f.name !== univ) {
                        this.props.dispatch(removeFilter(this.props.indicador, f.name));
                    }
                });
            }
        });
    }

    componentWillUnmount() {
        this.backListener();
    }

    componentWillUpdate(nextProps) {
        let minValues = false;
        let maxValues = false;
        if (this.state.firstDispatch) {
            nextProps.filters.forEach((elem) => {
                if (elem.url === "min_year" && elem.values && elem.values.length) {
                    minValues = elem.values;
                }
                if (elem.url === "max_year" && elem.values && elem.values.length) {
                    maxValues = elem.values;
                }
            })
            if (minValues && maxValues) {
                let lastYear = minValues.sort(sort('year'))[minValues.length - 1].year;
                this.props.dispatch(addFilter(this.props.indicador, { name: "min_year", value: lastYear + '', label: lastYear }))
                this.props.dispatch(addFilter(this.props.indicador, { name: "max_year", value: lastYear + '', label: lastYear }))
                this.setState({ firstDispatch: false });
            }
        }
    }
    onUpdate(yearType) {
        this.setState({ yearType });
    }

    getFixedFilter(filter) {
        const univFilter = (this.props.indicador.universityAggregate) ? 'uni_offer_aggregate' : 
        ((this.props.indicador.universityFilter) ? 'university' : 'universityLocalOffer');
        let f = Object.assign({}, this.props.filters.find((i) => i.url === filter));
        if (filter === 'state' && typeof getFilterValue('region', this) !== 'undefined') {
            f.values = f.values.filter((i) => i.region_id == getFilterValue('region', this));
        }
        if (filter === 'city') {
            if (typeof getFilterValue('state', this) !== 'undefined') {
                if (f.loaded) {
                    f.values = f.values.filter((i) => i.state_id == getFilterValue('state', this));
                } else if (!f.loading) {
                    this.props.dispatch(this.props.getFilterValues(this.props.indicador, f, f.route + '?filter=state:' + getFilterValue('state', this)));
                }
            } else {
                f.values = [];
            }
        }
        if (filter === 'school') {
            const year = this.props.indicador.selectedFilters[0]?.value
            const yearFilter =  year ? `,min_year` : '';

            if (typeof getFilterValue('city', this) !== 'undefined') {
                if (f.loaded) {
                    let duplicate = {};
                    f.values = f.values.filter((i) => {
                        if (i.city_id == getFilterValue('city', this) && !duplicate[i.id]) {
                            duplicate[i.id] = true;
                            return true;
                        }
                        return false;
                    });
                } else if (!f.loading && !f.error) {
                    this.props.dispatch(
                        this.props.getFilterValues(this.props.indicador,
                        f, f.route + '?filter=city:' + getFilterValue('city', this) + ',min_year:' + getFilterValue('min_year', this))
                    );
                }
            } else {
                f.values = [];
            }
        }
        if (filter === univFilter) {
            let highestFilter = null
            if (typeof getFilterValue('city', this) !== 'undefined') highestFilter = 'city'
            else if (typeof getFilterValue('state', this) !== 'undefined') highestFilter = 'state'
            else if (typeof getFilterValue('region', this) !== 'undefined') highestFilter = 'region'

            if (highestFilter !== null) {
                let highestFilterId = highestFilter + '_id'
                if (f.loaded) {
                    let duplicate = {};
                    f.values = f.values.filter((i) => {
                        if (i[highestFilterId] == getFilterValue(highestFilter, this) && !duplicate[i.id]) {
                            duplicate[i.id] = true;
                            return true;
                        }
                        return false;
                    });
                } else if (!f.loading && !f.error) {
                    this.props.dispatch(this.props.getFilterValues(this.props.indicador, f, f.route + '?filter=' + highestFilter + ':' + getFilterValue(highestFilter, this)));
                }
                else {
                    f.values = [];
                }
            } else {
                if (f.loaded) {
                    let duplicate = {};
                    f.values = f.values.filter((i) => {
                        if (!duplicate[i.id]) {
                            duplicate[i.id] = true;
                            return true;
                        }
                        return false;
                    });
                } else if (!f.loading) {
                    this.props.dispatch(this.props.getFilterValues(this.props.indicador, f, f.route));
                }
                else {
                    f.values = [];
                }
            }
        }
        if ((filter === 'min_year' || filter === 'max_year') && f.loaded) {
            let range = [];
            for (let i = 0; i < f.values.length; ++i) {
                range.push({ id: f.values[i].year, name: f.values[i].year + '' });
            }
            f.values = range;
        }
        if (this.props.indicador.groupname == 'Educação Básica - Censo Escolar/INEP' ||
            this.props.indicador.groupname == 'Educação Superior - Censo/INEP' ||
            this.props.indicador.groupname == 'PNAD e PNADC / IBGE'
            && filter == 'region') {
            for (let i = 0; i < f.values.length; i++) {
                if (f.values[i].name == 'Exterior') {
                    f.values.splice(i, 1);
                }
            }
        }
        return f;
    }

    filterLineResults(filters) {
        const univFilter = (this.props.indicador.universityAggregate) ? 'uni_offer_aggregate' : 
        ((this.props.indicador.universityFilter) ? 'university' : 'universityLocalOffer');
        let lineRes = [];
        //Run through filters array
        for (let i = 0; i < filters.length; i++) {
            //If filter can be lined under any condition
            if (filters[i].lineable.available &&
                (filters[i].url != 'school' || (!this.props.indicador.noSchools && !this.props.indicador.activateIES))
                && (filters[i].url != 'city' || !this.props.indicador.noCity) &&
                (filters[i].url != 'region' || !this.props.indicador.stateRequired) &&
                (filters[i].url != univFilter || this.props.indicador.activateIES)) {
                let fitsRequirements = true;
                let fitsForbidden = true;
                let fitsYears = true;
                let fitsLocation = true;

                if ((filters[i].url == 'localoffer') && (!this.props.indicador.selectedFilters.find(f => (f.name == 'region') || (f.name == 'state') || (f.name == 'city') || (f.name == univFilter)))) {
                    fitsLocation = false;
                }

                //Check if requirements are OK
                if (filters[i].years && this.props.indicador.selectedFilters.length) {
                    if ((filters[i].years.min && (filters[i].years.min > parseInt(this.props.indicador.selectedFilters[0].value))
                        || filters[i].years.max && (filters[i].years.max < parseInt(this.props.indicador.selectedFilters[1].value)))) {
                        fitsYears = false;
                    }
                }
                if (filters[i].lineable.required.filters) {
                    for (let requiredfilter in filters[i].lineable.required.filters) {
                        //Go through the selectedFilters array checking if any value is different from required
                        for (let j = 0; j < this.props.indicador.selectedFilters.length; j++) {
                            if (this.props.indicador.selectedFilters[j].name === requiredfilter && this.props.indicador.selectedFilters[j].label !== filters[i].lineable.required.filters[requiredfilter]) {
                                fitsRequirements = false;
                            }
                        }
                    }
                }
                //Check if forbidden values where not selected
                if (filters[i].lineable.forbidden && filters[i].lineable.forbidden.filters) {
                    for (let forbiddenfilter in filters[i].lineable.forbidden.filters) {
                        //Go through the selectedFilters array checking if any value is the same as forbidden
                        if (filters[i].lineable.forbidden.filters[forbiddenfilter] === null) {
                            let belongsTo = false;
                            for (let j = 0; j < this.props.indicador.selectedFilters.length; j++) {
                                if (this.props.indicador.selectedFilters[j].name === forbiddenfilter)
                                    belongsTo = true;
                            }
                            if (!belongsTo)
                                fitsForbidden = false;
                        } else {
                            for (let j = 0; j < this.props.indicador.selectedFilters.length; j++) {
                                if (this.props.indicador.selectedFilters[j].label === filters[i].lineable.forbidden.filters[forbiddenfilter])
                                    fitsForbidden = false;
                            }
                        }
                    }
                }
                if (fitsRequirements && fitsForbidden && fitsYears)
                    lineRes.push(filters[i]);
            }
        }
        return lineRes;
    }

    filterColResults(filters, lineResults, lineValue) {
        let colRes = [];
        //Run through filters array
        for (let i = 0; i < filters.length; i++) {
            //If filter can be columned under any condition
            if (filters[i].columnable.available) {
                let fitsRequirements = true;
                let fitsForbidden = true;
                let fitsYears = true;
                let fitsLocation = true;

                if ((filters[i].url == 'localoffer') && (!this.props.indicador.selectedFilters.find(f => (f.name == 'region') || (f.name == 'state') || (f.name == 'city')))) {
                    fitsLocation = false;
                }

                //Check if requirements are OK
                if (filters[i].years && this.props.indicador.selectedFilters.length) {
                    if ((filters[i].years.min && (filters[i].years.min > parseInt(this.props.indicador.selectedFilters[0].value))
                        || filters[i].years.max && (filters[i].years.max < parseInt(this.props.indicador.selectedFilters[1].value)))) {
                        fitsYears = false;
                    }
                }
                for (let requiredfilter in filters[i].columnable.required.filters) {
                    //Go through the selectedFilters array checking if any value is different from required
                    for (let j = 0; j < this.props.indicador.selectedFilters.length; j++) {
                        if (this.props.indicador.selectedFilters[j].name === requiredfilter && this.props.indicador.selectedFilters[j].label !== filters[i].columnable.required.filters[requiredfilter]) {
                            fitsRequirements = false;
                        }
                    }
                }
                //Check if forbidden values where not selected
                if (filters[i].columnable.forbidden && filters[i].columnable.forbidden.filters) {
                    for (let forbiddenfilter in filters[i].columnable.forbidden.filters) {
                        //Go through the selectedFilters array checking if any value is the same as forbidden
                        if (filters[i].columnable.forbidden.filters[forbiddenfilter] === null) {
                            let belongsTo = false;
                            for (let j = 0; j < this.props.indicador.selectedFilters.length; j++) {
                                if (this.props.indicador.selectedFilters[j].name === forbiddenfilter)
                                    belongsTo = true;
                            }
                            if (!belongsTo)
                                fitsForbidden = false;
                        } else {
                            for (let j = 0; j < this.props.indicador.selectedFilters.length; j++) {
                                if (this.props.indicador.selectedFilters[j].label === filters[i].columnable.forbidden.filters[forbiddenfilter])
                                    fitsForbidden = false;
                            }
                        }
                    }
                }
                if (filters[i].columnable.forbidden && filters[i].columnable.forbidden.lineResults && lineValue) {
                    //If there are multiple forbidden values for lineResults
                    if (typeof filters[i].columnable.forbidden.lineResults === "object") {
                        //Go through array checking if any forbidden value was selected
                        for (let j = 0; j < filters[i].columnable.forbidden.lineResults.length; j++) {
                            if (filters[i].columnable.forbidden.lineResults[j] === lineValue.name)
                                fitsForbidden = false;
                        }
                    } else {
                        if (filters[i].columnable.forbidden.lineResults === lineValue.name)
                            fitsForbidden = false;
                    }
                }
                if (fitsRequirements && fitsForbidden && fitsYears)
                    colRes.push(filters[i]);
            }

        }
        return colRes;
    }

    removeExteriorFiltros(filters) {

        if (this.props.indicador.name === "Número de Instituições de Educação Superior") {
        const aux = filters.findIndex(filter => filter.name === 'Região');

        if (aux !== -1) {
            const aux2 = filters[aux].values.findIndex(value => value.name === 'Exterior');

            if (aux2 !== -1) {
                // Remova o item no índice aux2 do array values
                filters[aux].values.splice(aux2, 1);
            } else {
            }
        }
    }
    }

    render() {        
        this.removeExteriorFiltros(this.props.filters)
        //taxAtend checks if the indicator is "taxa de atendimento" because that page should load just the "faixa etária" option on line selection
        //"'Taxa de Atendimento Educacional' added to taxAtend"
        var numIES = (this.props.indicador.name === "Número de Instituições de Educação Superior");
        var taxAtend = (this.props.indicador.name === "Taxa de Atendimento de 2004 a 2015" || this.props.indicador.name === "Taxa de Atendimento Educacional de 2019 a 2023")
        var instLevel = (this.props.indicador.name === "Nível de Instrução");
        var foraEscola = (this.props.indicador.name === "População Fora da Escola Até 2015");
        var liqFreq = (this.props.indicador.name === "Taxa ajustada de frequência líquida");
        var taxMatricula = (this.props.indicador.name === "Taxa de Matrícula");
        var outSchool = (this.props.indicador.name === "População Fora da Escola de 2019 a 2023")
        var crudeRate = (this.props.indicador.name === "Taxa de Matrícula Bruta de 2007 a 2015")
        const univFilter = (this.props.indicador.universityAggregate) ? 'uni_offer_aggregate' : 
        ((this.props.indicador.universityFilter) ? 'university' : 'universityLocalOffer');

        let nonFixedFilters = this.props.filters.reduce((prev, curr) => {
            if (!forbiddenFilters.includes(curr.url))
                prev.push(Object.assign({}, curr));
            return prev;
        }, []);
        nonFixedFilters = ((foraEscola) ?
            nonFixedFilters.filter(item => item.url !== "extremes_household_income" && item.url !== "fifth_household_income")
            :
            nonFixedFilters);
        //'taxa de atendimento' indicator shouldn't load faixa etária option
        nonFixedFilters = (taxAtend || instLevel) ? nonFixedFilters.filter(item => item.name !== "Faixa Etária") : nonFixedFilters;
        //Remove filters that are already selected from line and col results
        let selectedFilterNames = [];
        for (var i = 0; i < this.props.indicador.selectedFilters.length; i++) {
            let name = this.props.indicador.selectedFilters[i].name;
            selectedFilterNames.push(name);
        }

        let lineResults = this.filterLineResults(this.props.filters) // get filters that can be used as result rows in the table
            // Create data array for the select
            .reduce((prev, curr) => {
                prev.push({ id: curr.url, name: curr.name });
                return prev;
            }, [])

        let colResults = this.filterColResults(this.props.filters, lineResults, this.props.indicador.selectedResults[0]) // get filters that can be used as result columns in the table
            // Create data array for the select
            .reduce((prev, curr) => {
                prev.push({ id: curr.url, name: curr.name });
                return prev;
            }, [])

        let found = false;
        //Go through array checking if the selected line is no longer in available values, if so unsets line value
        for (i = 0; i < lineResults.length; i++)
            if (this.props.indicador.selectedResults[0] && this.props.indicador.selectedResults[0].name == lineResults[i].id)
                found = true;
        if (!found)
            this.props.indicador.selectedResults[0] = null;

        found = false;
        //Go through array checking if the selected column is no longer in available values, if so unsets column value
        for (i = 0; i < colResults.length; i++)
            if (this.props.indicador.selectedResults[1] && this.props.indicador.selectedResults[1].name == colResults[i].id)
                found = true;
        if (!found)
            this.props.indicador.selectedResults[1] = null;
        //Unset col value if line value is not selected
        if (!this.props.indicador.selectedResults[0])
            this.props.indicador.selectedResults[1] = null;

        let fixedFilters = {
            univFilter: { values: [] },
            'school': { values: [] },
            'city': this.getFixedFilter('city'),
            'state': this.getFixedFilter('state'),
            'region': this.getFixedFilter('region')
        }
        if (this.props.indicador.activateIES) fixedFilters[univFilter] = this.getFixedFilter(univFilter);
        else if (!this.props.indicador.noSchools) fixedFilters['school'] = this.getFixedFilter('school');

        return (
            <div>
                <div className="scrollable-in-aside row">
                    <h4 className={(this.props.indicador.name == "Taxa de Atendimento de 2004 a 2015" || this.props.indicador.name == "Taxa de Atendimento Educacional de 2019 a 2023") ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Faixa Etária</strong> como váriavel de resultado na Etapa 3</h4>
                    <h4 className={this.props.indicador.name == "População Fora da Escola de 2019 a 2023" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Faixa Etária</strong> como váriavel de resultado na Etapa 3</h4>
                    <h4 className={this.props.indicador.url == "despesa-aluno" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Despesas</strong> como váriavel de resultado na Etapa 3</h4>
                    <h4 className={this.props.indicador.url == "gasto-aluno" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Gasto-Aluno</strong> como váriavel de resultado na Etapa 3</h4>
                    <h4 className={this.props.indicador.url == "receita-aluno" || this.props.indicador.url == "receita-potencial" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Receitas</strong> como váriavel de resultado na Etapa 3</h4>
                    <h4 className={this.props.indicador.url == "gasto-aluno" || this.props.indicador.url == "receita-aluno" ? "alert-indicator" : "hidden"}>O filtro por <strong>Rede</strong> aprensentado na etapa "Refine sua consulta" funciona apenas à nível Brasil.</h4>
                    <h4 className={this.props.indicador.name == "Taxa ajustada de frequência líquida" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Faixa Etária</strong> como váriavel de resultado na Etapa 3</h4>
                    <h4 className={this.props.indicador.name == "Número de Docente por escola de 2021 a 2023" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Escola</strong> como váriavel de resultado na Etapa 1</h4>
                    <h4 className={this.props.indicador.name == "Taxa de Atendimento Educacional" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Faixa Etária</strong> como váriavel de resultado na Etapa 3</h4>
                    <h4 className={this.props.indicador.name == "Taxa de Matrícula Bruta de 2007 a 2015" || this.props.indicador.name == "Taxa de Matrícula Líquida" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Etapa da Educação Básica</strong> como váriavel de resultado na Etapa 3 e filtrar a etapa desejada.</h4>
                    <h4 className={this.props.indicador.name == "Carga Horária Diária" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Etapa de ensino</strong> como váriavel de resultado na Etapa 3 ou 4, assim como especificar o <strong>Tempo Integral</strong> e o <strong>Turno da Turma</strong> na Etapa 4</h4>
                    <h4 className={this.props.indicador.name == "Número de Alunos por Turma" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Etapa de ensino</strong> como váriavel de resultado na Etapa 3, assim como filtrar a(s) etapa(s) desejada(s) na etapa Refine sua consulta</h4>
                    <h4 className={this.props.indicador.name == "Nível de Instrução" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Nível de Instrução</strong> como váriavel de resultado na Etapa 3, assim como filtrar a(s) etapa(s) desejada(s) na etapa Refine sua consulta</h4>
                    <h4 className={this.props.indicador.name == "Taxa de Matrícula" ? "alert-indicator" : "hidden"}>Para o funcionamento correto desse indicador é obrigatório selecionar <strong>Faixa etária</strong> como váriavel de resultado na Etapa 3.</h4>
                    <h4 className={this.props.indicador.url == "despesas-ed-bas" ? "alert-indicator" : "hidden"}>O filtro por <strong>Rede</strong> aprensentado na etapa "Refine sua consulta" funciona apenas à nível Brasil.</h4>
                    <IndicadorDropdown {...this.props} titulo="SELECIONE A LOCALIDADE" numero="1" legend="Selecione o nível de agregação espacial: Brasil, regiões ou estados (municípios e escolas para alguns indicadores)" collapse={this.state.stepsStatus[0]}
                        onOpen={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++) {
                                if (this.state.stepsStatus[i] === OPEN)
                                    newStepStatus.push(SHADED);
                                else
                                    newStepStatus.push(this.state.stepsStatus[i]);
                            }
                            newStepStatus[0] = OPEN;
                            this.setState({ stepsStatus: newStepStatus });

                        }}
                        onClosing={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++)
                                newStepStatus.push(this.state.stepsStatus[i]);
                            newStepStatus[0] = SHADED;
                            this.setState({ stepsStatus: newStepStatus });
                        }}>
                        <IndicadorSelect placeholder="Região" valores={fixedFilters['region'].values.sort(sort('name'))} isLoading={fixedFilters['region'].loading} value={getFilterValue('region', this)} hidden={this.props.indicador.stateRequired} onChange={(val) => {
                            if (val && val.value) {
                                this.props.dispatch(addFilter(this.props.indicador, { name: 'region', value: val.value, label: val.label }));
                                this.props.dispatch(removeFilter(this.props.indicador, 'state'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'city'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'school'));
                                this.props.dispatch(removeFilter(this.props.indicador, univFilter));
                            }
                            else {
                                this.props.dispatch(removeFilter(this.props.indicador, 'region'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'state'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'city'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'school'));
                                this.props.dispatch(removeFilter(this.props.indicador, univFilter));
                            }
                            this.props.filters.find((f) => f.url === univFilter).loaded = !this.props.indicador.activateIES;
                        }} />
                        <span className="state-required" hidden={!this.props.indicador.stateRequired}>É obrigatório selecionar um estado</span>
                        <IndicadorSelect placeholder="UF" valores={fixedFilters['state'].values.sort(sort('name'))} isLoading={fixedFilters['state'].loading} value={getFilterValue('state', this)} onChange={(val) => {
                            if (val && val.value) {
                                this.props.dispatch(addFilter(this.props.indicador, { name: 'state', value: val.value, label: val.label }));
                                this.props.dispatch(removeFilter(this.props.indicador, 'city'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'school'));
                                this.props.dispatch(removeFilter(this.props.indicador, univFilter));

                            } else {
                                this.props.dispatch(removeFilter(this.props.indicador, 'state'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'city'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'school'));
                                this.props.dispatch(removeFilter(this.props.indicador, univFilter));
                            }
                            this.props.filters.find((f) => f.url === 'city').loaded = false;
                            this.props.filters.find((f) => f.url === univFilter).loaded = !this.props.indicador.activateIES;
                        }} />

                        <IndicadorSelect placeholder="Município" valores={fixedFilters['city'].values.sort(sort('name'))} isLoading={fixedFilters['city'].loading} value={getFilterValue('city', this)} disabled={!fixedFilters['city'].values.length} hidden={this.props.indicador.noCity} onChange={(val) => {
                            if (val && val.value) {
                                this.props.dispatch(addFilter(this.props.indicador, { name: 'city', value: val.value, label: val.label }));
                                this.props.dispatch(removeFilter(this.props.indicador, 'school'));
                                this.props.dispatch(removeFilter(this.props.indicador, univFilter));
                            } else {
                                this.props.dispatch(removeFilter(this.props.indicador, 'city'));
                                this.props.dispatch(removeFilter(this.props.indicador, 'school'));
                                this.props.dispatch(removeFilter(this.props.indicador, univFilter));
                            }
                            this.props.filters.find((f) => f.url === univFilter).loaded = !this.props.indicador.activateIES;
                            this.props.filters.find((f) => f.url === 'school').loaded = this.props.indicador.noSchools === true || this.props.indicador.activateIES;
                        }} />
                        <IndicadorSelect placeholder="Escola" valores={fixedFilters['school'].values.sort(sort('name'))} isLoading={fixedFilters['school'].loading} value={getFilterValue('school', this)} disabled={!fixedFilters['school'].values.length} hidden={this.props.indicador.noSchools || this.props.indicador.activateIES} onChange={(val) => {
                            if (val && val.value)
                                this.props.dispatch(addFilter(this.props.indicador, { name: 'school', value: val.value, label: val.label }));
                            else
                                this.props.dispatch(removeFilter(this.props.indicador, 'school'));
                        }} />
                        <IndicadorSelect placeholder="Instituição de Educação Superior" valores={typeof fixedFilters[univFilter] !== 'undefined' ? fixedFilters[univFilter].values.sort(sort('name')) : []} isLoading={typeof fixedFilters[univFilter] !== 'undefined' ? fixedFilters[univFilter].loading : null} value={getFilterValue(univFilter, this)} disabled={typeof fixedFilters[univFilter] !== 'undefined' ? !fixedFilters[univFilter].values.length : null} hidden={!this.props.indicador.activateIES} onChange={(val) => {
                            if (val && val.value)
                                this.props.dispatch(addFilter(this.props.indicador, { name: univFilter, value: val.value, label: val.label }));
                            else
                                this.props.dispatch(removeFilter(this.props.indicador, univFilter));
                        }} />
                    </IndicadorDropdown>
                    <IndicadorDropdown {...this.props} titulo="SELECIONE O PERÍODO" numero="2" legend="Selecione o período: um ano específico ou série histórica" collapse={this.state.stepsStatus[1]}
                        onOpen={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++) {
                                if (this.state.stepsStatus[i] === OPEN)
                                    newStepStatus.push(SHADED);
                                else
                                    newStepStatus.push(this.state.stepsStatus[i]);
                            }
                            newStepStatus[1] = OPEN;
                            this.setState({ stepsStatus: newStepStatus });

                        }}
                        onClosing={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++)
                                newStepStatus.push(this.state.stepsStatus[i]);
                            newStepStatus[1] = SHADED;
                            this.setState({ stepsStatus: newStepStatus });
                        }}>
                        <AnoSelect valores={this.getFixedFilter('min_year').values.sort(sort())} yearType={this.state.yearType} onUpdate={this.onUpdate.bind(this)} loading={this.getFixedFilter('min_year').loading} firstValue={getFilterValue('min_year', this)} lastValue={getFilterValue('max_year', this)} onChangeFirst={(val) => {
                            if (val && val.value)
                                this.props.dispatch(addFilter(this.props.indicador, {
                                    name: 'min_year',
                                    value: val.value,
                                    label: val.label
                                }));
                        }} onChangeLast={(val) => {
                            if (val && val.value)
                                this.props.dispatch(addFilter(this.props.indicador, {
                                    name: 'max_year',
                                    value: val.value,
                                    label: val.label
                                }));
                        }} onSelectRange={() => {
                            let availableYears = this.getFixedFilter('min_year').values.sort(sort());
                            this.props.dispatch(removeColResult(this.props.indicador, this.props.indicador.selectedResults[1]));
                            this.props.dispatch(addFilter(this.props.indicador, {
                                name: 'max_year',
                                value: availableYears[availableYears.length - 1].id,
                                label: availableYears[availableYears.length - 1].name
                            }));
                            this.props.dispatch(addFilter(this.props.indicador, {
                                name: 'min_year',
                                value: availableYears[0].id,
                                label: availableYears[0].name
                            }));
                        }} />
                    </IndicadorDropdown>

                    <IndicadorDropdown {...this.props} titulo="MONTE SUA CONSULTA" numero="3" legend="Selecione as informações a serem exibidas no resultado" collapse={this.state.stepsStatus[3]}
                        onOpen={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++) {
                                if (this.state.stepsStatus[i] === OPEN)
                                    newStepStatus.push(SHADED);
                                else
                                    newStepStatus.push(this.state.stepsStatus[i]);
                            }
                            newStepStatus[3] = OPEN;
                            this.setState({ stepsStatus: newStepStatus });
                            if (this.props.indicador.groupname == 'Educação Básica - Censo Escolar/INEP' || this.props.indicador.groupname == 'PNAD e PNADC / IBGE') {
                                for (i = 0; i < this.props.filters.length; i++) {
                                    if (this.props.filters[i].name == 'Instituição de Educação Superior') {
                                        this.props.filters.splice(i, 1);
                                    }
                                }
                            }
                        }}
                        onClosing={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++)
                                newStepStatus.push(this.state.stepsStatus[i]);
                            newStepStatus[3] = SHADED;
                            this.setState({ stepsStatus: newStepStatus });
                        }}>
                        <IndicadorSelect placeholder="Linha: selecione uma variável"
                            //If the indicator to be generated is 'taxa de atendimento', the line selection options must be reduced to just 'faixa etária'
                            valores={
                                (taxAtend) ?
                                    lineResults.filter(item => item.id === "age_range")
                                    :
                                    (foraEscola) ? lineResults.filter(item => item.id !== "extremes_household_income" && item.id !== "fifth_household_income")
                                        :
                                        (numIES) ? lineResults.filter(item => item.id !== "university")
                                             :
                                            (instLevel) ? lineResults.filter(item => item.id === "instruction_level")
                                             : 
                                             (liqFreq) ? lineResults.filter(item => item.id === "age_range_all") 
                                             :
                                             (taxMatricula) ? lineResults.filter(item => item.id !== "region" && item.id !=="state" && item.id !== "university"):

                                             (crudeRate) ? lineResults.filter(item => item.id === "education_level_short")
                                             :
                                             (outSchool) ? lineResults.filter(item => item.id === "age_range_pop_school") : lineResults
                            }
                            value={this.props.indicador.selectedResults[0]}
                            onChange={(val) => {
                                if (val && val.value) {
                                    if ("Município" == val.label) {
                                        this.props.dispatch({ type: 'ALERT_WARNING', message: 'Esta consulta retorna resultado de todos os municípios e poderá demorar vários minutos, dependendo da conexão e navegador usados. Ao fazer essa consulta é recomendado usar o navegador Google Chrome.', timeout: 25000 })
                                    }
                                    if ("Instituição de Educação Superior" == val.label) {
                                        this.props.dispatch({ type: 'ALERT_WARNING', message: 'Esta consulta retorna resultado de todas as instituições de educação superior e poderá demorar vários minutos, dependendo da conexão e navegador usados. Ao fazer essa consulta é recomendado usar o navegador Google Chrome.', timeout: 25000 })
                                    }
                                    if ("Deficiência" == val.label && this.props.indicador.url == "matriculas-superior") {
                                        this.props.dispatch({ type: 'ALERT_WARNING', message: 'Nos anos de 2012 a 2017, o INEP informa se o aluno é uma pessoa com deficiência, transtorno global do desenvolvimento ou altas habilidades/superdotação. Nos anos de 2010 e 2011, o INEP informa se o aluno possui deficiência.', timeout: 10000 })
                                    }
                                    if ("Polo ou Campi" == val.label) {
                                        this.props.dispatch({ type: 'ALERT_WARNING', message: 'Esta consulta retorna resultado de todos os polos/campi e poderá demorar vários minutos, dependendo da conexão e navegador usados. Ao fazer essa consulta é recomendado usar o navegador Google Chrome.', timeout: 25000 })
                                    }
                                    if ("pee_por_categoria" == val.value) {
                                        this.props.dispatch({ type: 'ALERT_WARNING', message: 'Aviso: Os valores de PEE Por Categoria não podem ser cruzados com outra variável.', timeout: 25000 })
                                    }
                                    this.props.dispatch(addLineResult(this.props.indicador, { name: val.value, label: val.label }));
                                }
                                else
                                    this.props.dispatch(removeLineResult(this.props.indicador, null));
                            }} />


                        <IndicadorSelect placeholder="Coluna: selecione uma variável"
                            valores={
                                (foraEscola ? colResults.filter(item => item.id !== "extremes_household_income" && item.id !== "fifth_household_income")
                                    :
                                    colResults)
                            }
                            value={this.props.indicador.selectedResults[1]} disabled={(this.props.indicador.selectedResults[0] == null || this.state.yearType === RANGE || this.props.indicador.selectedResults[0].name == "localoffer") || ["localoffer", "pee_por_categoria"].includes(this.props.indicador.selectedResults[0].name) || this.props.indicador.url === "docente-ente-federativo"} onChange={(val) => {
                                if (val && val.value) {
                                    if ("pee_por_categoria" == val.value) {
                                        this.props.dispatch({ type: 'ALERT_WARNING', message: 'Aviso: Os valores de PEE Por Categoria não podem ser cruzados com outra variável.', timeout: 25000 })
                                    } else {
                                        this.props.dispatch(addColResult(this.props.indicador, { name: val.value, label: val.label }));
                                    }

                                }
                                else
                                    this.props.dispatch(removeColResult(this.props.indicador, null));
                            }} />


                    </IndicadorDropdown>
                </div>

                <ConsultaFooter query={() => {
                    this.props.dispatch(getIndicatorResult(this.props.indicador));
                }} clearFilters={() => {
                    this.props.indicador.selectedFilters.forEach((f) => {
                        if (f.name == 'region' || f.name == 'state' || f.name == 'city' || f.name == 'school' || f.name == univFilter) {
                            this.props.dispatch(removeFilter(this.props.indicador, f.name));
                        }
                    });
                    this.props.dispatch(removeLineResult(this.props.indicador, this.props.indicador.selectedResults[0]));
                    this.props.dispatch(removeColResult(this.props.indicador, this.props.indicador.selectedResults[1]));
                    this.setState({ stepsStatus: [CLEAR, CLEAR, CLEAR, CLEAR] });
                }} />
                <div className="scrollable-in-aside row">
                    <IndicadorDropdown {...this.props} titulo="REFINE SUA CONSULTA" legend="Selecione as informações para especificar os dados da consulta" collapse={this.state.stepsStatus[2]}
                        onOpen={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++) {
                                if (this.state.stepsStatus[i] === OPEN)
                                    newStepStatus.push(SHADED);
                                else
                                    newStepStatus.push(this.state.stepsStatus[i]);
                            }
                            newStepStatus[2] = OPEN;
                            this.setState({ stepsStatus: newStepStatus });

                        }}
                        onClosing={() => {
                            let newStepStatus = [];
                            for (let i = 0; i < this.state.stepsStatus.length; i++)
                                newStepStatus.push(this.state.stepsStatus[i]);
                            newStepStatus[2] = SHADED;
                            this.setState({ stepsStatus: newStepStatus });
                        }}>
                        {nonFixedFilters.map((f) => {
                            let available = true;
                            if (f.years && this.props.indicador.selectedFilters.length) {
                                if ((f.years.min && (f.years.min > parseInt(this.props.indicador.selectedFilters[0].value))
                                    || f.years.max && (f.years.max < parseInt(this.props.indicador.selectedFilters[1].value)))) {
                                    available = false;
                                }
                            }
                            if ((f.name != "Funcionários por Função") && (f.name != "Local da oferta (Campi e/ou Polos)") && (f.name != "Local da oferta (Campus ou Polos)") && (f.name != "Município") && available) {
                                return (<IndicadorCheckboxes placeholder={f.name} valores={f.values.sort(sort('id'))} key={f.name} unfiltrable={f.unfiltrable} selectedFilters={this.props.indicador.selectedFilters} isLoading={f.loading} value={getFilterValue(f.url, this)} onChange={(val) => {
                                    if (val.length > 0)
                                        this.props.dispatch(addMultiFilter(this.props.indicador, f.url, val, f.name));
                                    else {
                                        this.props.dispatch(removeFilter(this.props.indicador, f.url));
                                    }
                                }} />)
                            }
                        })}
                    </IndicadorDropdown>

                </div>
                <ListaFiltrosFooter query={() => {
                    this.props.dispatch(getIndicatorResult(this.props.indicador));
                }} clearQuery={() => {
                    this.props.indicador.selectedFilters.forEach((f) => {
                        if (f.name !== 'min_year' && f.name !== 'max_year' && f.name !== 'region' && f.name !== 'state' && f.name !== 'city' && f.name !== 'school' && f.name !== univFilter) {
                            this.props.dispatch(removeFilter(this.props.indicador, f.name));
                        }
                    });
                }} clearFilters={() => {
                    this.props.indicador.selectedFilters.forEach((f) => {
                        if (f.name == 'region' || f.name == 'state' || f.name == 'city' || f.name == 'school' || f.name == univFilter) {
                            this.props.dispatch(removeFilter(this.props.indicador, f.name));
                        }
                    });
                    this.props.dispatch(removeLineResult(this.props.indicador, this.props.indicador.selectedResults[0]));
                    this.props.dispatch(removeColResult(this.props.indicador, this.props.indicador.selectedResults[1]));
                    this.setState({ stepsStatus: [CLEAR, CLEAR, CLEAR, CLEAR] });
                }} />
            </div>
        );
    }
}

export default ListaFiltro;
