const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = null;
let selected = null;
let prevYear = '2000'

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d => d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function(){
        lineParam = d3.select(this).property('value');
        updateLine();
    });

    function updateBar(){
        regions = d3.map(data, function (d) {
            return d['region'];
        }).keys();

        mean = regions.map(
            region => (
                d3.mean(
                    data.filter(d => d['region'] == region)
                        .flatMap(d => d[param][year])
                )
            )
        );

        region_mean = [];
        regions.forEach((key, i) => {
            region_mean.push({"region": key, "mean": mean[i]});
        });

        xBar.domain(regions);
        xBarAxis.call(d3.axisBottom(xBar));

        yBar.domain([0, d3.max(mean)]).range([500, 0]);
        yBarAxis.call(d3.axisLeft(yBar));

        barChart.selectAll('rect').data(region_mean).enter().append('rect')
            .attr('width', xBar.bandwidth())
            .attr('height', d => 500 - yBar(d['mean']))
            .attr('x', d => xBar(d['region']))
            .attr('y', d => yBar(d['mean']) - 30)
            .attr("fill", d => colorScale(d['region']));

        barChart.selectAll('rect').data(region_mean)
            .attr('width', xBar.bandwidth())
            .attr('height', d => 500 - yBar(d['mean']))
            .attr('x', d => xBar(d['region']))
            .attr('y', d => yBar(d['mean']) - 30)
            .attr("fill", d => colorScale(d['region']));
        
        if (prevYear != d3.select('#range').property('value')) {
            barChart.selectAll('rect').attr('opacity', 1);
            scatterPlot.selectAll('circle').style('visibility', 'visible');
            highlighted = null;
            prevYear = d3.select('#range').property('value');
        }

        barChart.selectAll('rect').on('click', function (data) {
            if (highlighted != this) {
                barChart.selectAll('rect').attr('opacity', 0.5);
                d3.select(this).attr('opacity', 1);
                scatterPlot.selectAll('circle').style('visibility', 'hidden');
                scatterPlot.selectAll('circle').filter(d => d['region'] == data.region).style('visibility', 'visible');
                highlighted = this;
            } else {
                barChart.selectAll('rect').attr('opacity', 1);
                scatterPlot.selectAll('circle').style('visibility', 'visible');
                highlighted = null;
            }
        });
        return;
    }

    function updateScattePlot(){
        let xRange = data.map(d => +d[xParam][year]);
        x.domain([d3.min(xRange), d3.max(xRange)]);
        xAxis.call(d3.axisBottom(x));

        let yRange = data.map(d => +d[yParam][year])
        y.domain([d3.min(yRange), d3.max(yRange)])
        yAxis.call(d3.axisLeft(y))

        let rRange = data.map(d => +d[rParam][year]);
        radiusScale.domain([d3.min(rRange), d3.max(rRange)])

        scatterPlot.selectAll('circle').data(data)
            .enter()
            .append('circle')
            .attr('cx', d => x(d[xParam][year]))
            .attr('cy', d => y(d[yParam][year]))
            .attr('region', d => (d.region))
            .attr('fill', d => colorScale(d.region))
            .attr('r', d => radiusScale(d[rParam][year]))

        scatterPlot.selectAll('circle').data(data)
            .attr('cx', d => x(d[xParam][year]))
            .attr('cy', d => y(d[yParam][year]))
            .attr('fill', d => colorScale(d.region))
            .attr('region', d => (d.region))
            .attr('r', d => radiusScale(d[rParam][year]))

        scatterPlot.selectAll('circle').on("click", function(d) {
            selected = d.country;
            countryName.html(selected);
            scatterPlot.selectAll('circle').attr('stroke-width', null);
            d3.select(this).raise().attr('stroke-width', 5)
            updateLine();
        });
    }

    function updateLine(){
        let chosenCountry = data.find(country => country.country === selected)

        yLineRange = Object.values(chosenCountry[lineParam]).map(x => Number.parseInt(x, 10)).slice(0, 221)
        y.domain([d3.min(yLineRange), d3.max(yLineRange)])
        yLineAxis.call(d3.axisLeft(y))

        xLineRange = data.map(d => { return Object.keys(d[lineParam]);});
        xLineRange = xLineRange[0].map(x => Number.parseInt(x, 10)).slice(0, 221);
        x.domain([d3.min(xLineRange), d3.max(xLineRange)])
        xLineAxis.call(d3.axisBottom(x))

        let new_data = xLineRange.map((item, number) => ({ year: item, value: yLineRange[number] }))

        line = d3.line()
            .defined(d => !isNaN(d.value))
            .x(d => x(d.year))
            .y(d => y(d.value))

        d3.selectAll('#lines')
            .attr("display", "none")

        lineChart.append("path")
            .datum(new_data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line)
            .attr("id", "lines");
        return;
    }

    updateBar();
    updateScattePlot();
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}