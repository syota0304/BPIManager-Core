import * as React from 'react';

import Typography from '@material-ui/core/Typography';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SongsUI from './viewComponents/ui';
import Settings from './viewComponents/settings';
import { scoresDB, rivalListsDB } from '@/components/indexedDB';
import RivalStats from './viewComponents/stats';
import { scoreData, rivalScoreData, rivalStoreData, DBRivalStoreData } from '@/types/data';
import { withRivalData } from '@/components/stats/radar';
import Loader from '../common/loader';
import Container from '@material-ui/core/Container/Container';

interface S {
  isLoading:boolean,
  currentTab:number,
  full:withRivalData[],
  rivalRawData:rivalScoreData[],
}

interface P {
  rivalData:string,
  backToMainPage:()=>void
  toggleSnack:()=>void,
  isNotRival?:boolean,
  rivalMeta:rivalStoreData|DBRivalStoreData|null,
  descendingRivalData?:rivalScoreData[],
  showAllScore:boolean,
}

class RivalView extends React.Component<P,S> {

  constructor(props:P){
    super(props);
    this.state = {
      isLoading:true,
      currentTab:0,
      full:[],
      rivalRawData:[]
    }
  }

  async componentDidMount(){
    this.loadRivalData();
  }

  loadRivalData = async()=>{
    this.setState({isLoading:true});
    const {rivalData,showAllScore,descendingRivalData} = this.props;
    const raw = await fullData(descendingRivalData,rivalData);
    return this.setState({
      isLoading:false,
      rivalRawData:raw,
      full:await makeRivalStat(raw,showAllScore)
    });
  }

  handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    this.setState({currentTab:newValue});
  };

  rivalName = ()=> (this.props.isNotRival ? (this.props.rivalMeta as rivalStoreData).displayName : (this.props.rivalMeta as DBRivalStoreData).rivalName);

  render(){
    const {isLoading,currentTab,full,rivalRawData} = this.state;
    const {backToMainPage,isNotRival,rivalMeta,showAllScore} = this.props;
    if(isLoading){
      return (<Loader/>);
    }
    return (
      <Container fixed  className="commonLayout">
        <Typography component="h5" variant="h5" color="textPrimary" gutterBottom>
          <Button onClick={backToMainPage} style={{minWidth:"auto",padding:"6px 0px"}}><ArrowBackIcon/></Button>
          &nbsp;{rivalMeta && this.rivalName()}
        </Typography>
        {(!rivalMeta || isNotRival) && <SongsUI rivalName={this.rivalName} showAllScore={showAllScore} type={0} full={full}/>}
        {(rivalMeta && !isNotRival) && (
          <div>
            <Tabs
              value={this.state.currentTab}
              onChange={this.handleChange}
              indicatorColor="primary"
              textColor="secondary"
              style={{margin:"5px 0"}}
            >
              <Tab label="比較" />
              <Tab label="統計" />
              {!isNotRival && <Tab label="設定" />}
            </Tabs>
            {currentTab === 0 && <SongsUI rivalName={this.rivalName} showAllScore={showAllScore} type={0} full={full}/>}
            {currentTab === 1 && <RivalStats full={full} rivalRawData={rivalRawData}/>}
            {currentTab === 2 && <Settings backToMainPage={this.props.backToMainPage} toggleSnack={this.props.toggleSnack} rivalMeta={rivalMeta as DBRivalStoreData}/>}
          </div>
        )}
      </Container>
    );
  }
}

export default RivalView;

export const makeRivalStat = async(full:rivalScoreData[],showAllScore:boolean = false)=>{
  const allScores = (await new scoresDB().getAll()).reduce((groups:{[key:string]:scoreData},item:scoreData)=>{
    groups[item.title + item.difficulty] = item;
    return groups;
  },{});
  const rivalRawData = full;
  const allRivalScores = rivalRawData.reduce((groups:{[key:string]:rivalScoreData},item:rivalScoreData)=>{
    groups[item.title + item.difficulty] = item;
    return groups;
  },{});
  return Object.keys(allRivalScores).reduce((groups:withRivalData[],key:string)=>{
    const mine = allScores[key] || {
      exScore:0,
      missCount:NaN,
      clearState:7,
      updatedAt:"-",
    };
    if(showAllScore || mine.exScore !== 0){
      const rival = allRivalScores[key];
      groups.push({
        title:mine.title,
        difficulty:mine.difficulty,
        difficultyLevel:mine.difficultyLevel,
        myEx:mine.exScore,
        rivalEx:rival.exScore,
        myMissCount:mine.missCount,
        rivalMissCount:rival.missCount,
        myClearState:mine.clearState,
        rivalClearState:rival.clearState,
        myLastUpdate:mine.updatedAt,
        rivalLastUpdate:rival.updatedAt,
      });
    }
    return groups;
  },[]);
}

export const fullData = async(descendingRivalData:rivalScoreData[]|undefined,rivalData:string = ""):Promise<rivalScoreData[]>=>{
  return (descendingRivalData || await new rivalListsDB().getAllScores(rivalData))
}
