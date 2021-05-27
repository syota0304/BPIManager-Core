import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { Switch, FormGroup, FormLabel, Divider } from "@material-ui/core";

interface Props{
  toggleSettings:()=>void
}

export class CameraSettings extends React.Component<Props,{
  cams:any[],
  currentCam:any,
  autoSave:boolean
}> {

  constructor(props:Props){
    super(props);
    const def = {
      label:"",
      deviceId:"",
    };
    const current = localStorage.getItem("currentCam");
    const autoSave = localStorage.getItem("autoSaveAfterTook");
    this.state = {
      cams:[],
      currentCam:current ? JSON.parse(current) : def,
      autoSave:autoSave === "true"
    }
  }

  componentDidMount(){
    navigator.mediaDevices.enumerateDevices().then(items=>{
      const t = items.filter(({ kind }) => kind === "videoinput").reduce((groups:any[],item:MediaDeviceInfo)=>{
        groups.push({label:item.label,deviceId:item.deviceId})
        return groups;
      },[]);
      return this.setState({cams:t});
    });
  }

  setCam = (e:React.ChangeEvent<any>)=>{
    if(e.target){
      const {cams} = this.state;
      const target = cams.find(item=>item.deviceId === e.target.value);
      localStorage.setItem("currentCam",JSON.stringify(target));
      this.setState({currentCam:target});
    }else{
      alert("no target");
    }
  }

  setSaveImage = (e:React.ChangeEvent<any>)=>{
    this.setState({autoSave:e.target.checked});
    localStorage.setItem("autoSaveAfterTook",String(e.target.checked));
  }

  render(){
    const {cams,currentCam,autoSave} = this.state;
    return (
      <Dialog open={true} onClose={this.props.toggleSettings}>
        <DialogTitle className="narrowDialogTitle">設定</DialogTitle>
        <DialogContent className="narrowDialogContent">
          <FormControl style={{display:"block"}}>
            <InputLabel>カメラ選択</InputLabel>
            <Select
              value={currentCam.deviceId}
              onChange={this.setCam}
            >
              {cams.map((item:any)=>{
                return <MenuItem key={item.label} value={item.deviceId}>{item.label}</MenuItem>;
              })}
            </Select>
            <FormHelperText>写真撮影に使用するカメラを選択してください。</FormHelperText>
          </FormControl>
          <Divider style={{margin:"10px 0"}}/>
          <FormControl component="fieldset" style={{display:"block"}}>
            <FormLabel component="legend">撮影後のアクション</FormLabel>
            <FormGroup row>
              <FormControlLabel control={<Switch onChange={this.setSaveImage} checked={autoSave} />} label="撮影した画像を自動保存" />
            </FormGroup>
          </FormControl>

        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={this.props.toggleSettings}>閉じる</Button>
        </DialogActions>
      </Dialog>
    );
  }
}
