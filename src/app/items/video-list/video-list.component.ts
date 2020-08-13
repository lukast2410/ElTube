import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { DataService } from 'src/app/services/data.service';
import gql from 'graphql-tag';

@Component({
  selector: 'app-video-list',
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.scss']
})
export class VideoListComponent implements OnInit {
  @Output() act = new EventEmitter<any>();

  @Input() video;
  @Input() isUser: boolean;
  @Input() idx: number;
  channel;

  GET_QUEUE = gql `
    query GetMyQueue($user_id: Int!){
      getMyQueue(user_id: $user_id){
        id
        user_id
        video_id
      }
    }
  `
  
  addSave: boolean;

  //user
  users = [];
  user = null;
  loggedIn = false;

  channelName: string;
  channelID: number;
  duration: string;
  views: number;
  publishDate: string;

  constructor(private apollo: Apollo, public data: DataService) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
    }

    this.duration = this.data.formatVideoDuration(this.video.duration);
    this.channelName = "";
    this.views = this.video.views - 1;
    this.publishDate = "";
    this.channelID = 0;
    this.addSave = false;
    this.formatPublishDate();
    this.getChannelByID();
  }

  formatPublishDate(){
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours() + 1;
    console.log("hour: " + hours + " video: " + this.video.hours);
    let minutes = date.getMinutes() + 1;
    let seconds = date.getSeconds() + 1;

    let result = 0;
    if(this.video.year < year){
      result = (year - this.video.year);
      this.publishDate = result.toString() + " year";
    }else if(this.video.month < month){
      result = (month - this.video.month);
      this.publishDate = result.toString() + " month";
    }else if(this.video.day < day){
      result = (day - this.video.day);
      this.publishDate = result.toString() + " day";
    }else if(this.video.hours < hours){
      result = (hours - this.video.hours);
      this.publishDate = result.toString() + " hour"
    }else if(this.video.minutes < minutes){
      result = (minutes - this.video.minutes);
      this.publishDate = result.toString() + " minute"
    }else{
      result = (seconds - this.video.seconds);
      this.publishDate = result.toString() + " second"
    }

    if(result > 1){
      this.publishDate += "s ago"
    }else{
      this.publishDate += " ago"
    }
  }

  getChannelByID(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetOneChannelByID($id: ID!){
          getOneChannelByID(id: $id){
            id
            user_id
            name
            description
            stats
            subscriber
            day
            month
            year
            icon_path
            art_path
            channel_link
          }
        }
      `,
      variables:{
        id: this.video.channel_id,
      }
    }).valueChanges.subscribe(result =>{
      this.channel = result.data.getOneChannelByID;
      this.channelName = this.channel.name;
      this.channelID = this.channel.id;
    })
  }
  
  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  doAct(word: string){
    if(word == "save"){
      this.act.emit({idx: this.idx, cond: "save", id: this.video.id});
    }
    this.toggleAddSave();
  }
  
  toggleAddSave(){
    this.addSave = !this.addSave;
  }
  
  addQueue(){
    if(this.user == null){
      return;
    }
    this.apollo.mutate({
      mutation: gql `
        mutation CreateQueue($user_id: Int!, $video_id: Int!){
          createQueue(input: {user_id: $user_id, video_id: $video_id}){
            id
            user_id
            video_id
          }
        }
      `,
      variables:{
        user_id: this.user.id,
        video_id: this.video.id,
      },
      refetchQueries:[{
        query: this.GET_QUEUE
        , variables:{
          user_id: this.user.id,
        }
      }]
    }).subscribe(result => {
      console.log("added Queue video with id: " + this.video.id);
    })
  }
}
