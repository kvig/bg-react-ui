
    import React, { Component } from 'react';
    import Grid from '@material-ui/core/Grid';
	import Typography from '@material-ui/core/Typography';
    import Button from '@material-ui/core/Button';

	import SystemsService from '../services/system_service';
	import AdminService from '../services/admin_service';
	import PageHeader from '../components/page_header';
	import SystemCard from '../components/system_admin_card';
	import Divider from '../components/divider';

    class SystemsAdminApp extends Component {
      systems = this.props.systems;
//      gardens = this.props.gardens;
	  state = {
        data: []
      }

      formatSystems(){
        let system_names = [];
        for(let i in this.systems){
          if(!system_names.includes(this.systems[i].name)){
              system_names.push(this.systems[i].name);
          }
        }
        system_names.sort()
        let sortedSystems = [];
        for(let i in system_names){
          sortedSystems[i] = SystemsService.filterSystems(this.systems, {name: system_names[i]});
        }
        this.setState({data: sortedSystems})
      }

      title = "Systems Management";
      breadcrumbs = null;

	  componentDidMount() {
	      this.formatSystems();
      }

      render() {
        return (
        <div>
          <Grid
             justify="space-between"
             container
          >
              <Grid item >
                <PageHeader title = {this.title} />
              </Grid>
              <Grid item>
                  <Typography style={{ flex: 1 }}>
                      <Button variant="contained" color="secondary" >Clear All Queues</Button>
                      <Button onClick={() => AdminService.rescan()} variant="contained" color="primary" >Rescan Plugin Directory</Button>
                  </Typography>
              </Grid>
          </Grid>
          <Divider />
          <Grid container spacing={3} >
              {(this.state.data).map((systems, index) => (
                  <Grid item xs={4} key={"systems"+index} >
                    <SystemCard systems = {systems} self = {this} />
                  </Grid>
              ))}
          </Grid>

        </div>
        )
      }
    }

    export default SystemsAdminApp;