import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-box',
  templateUrl: './video-box.component.html',
  styleUrls: ['./video-box.component.scss']
})
export class VideoBoxComponent implements OnInit {
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

  channelID: number;
  channelName: string;
  channelIcon: string;
  duration: string;
  views: number;
  publishDate: string;

  addSave: boolean;
  
  //user
  users = [];
  user = null;
  loggedIn = false;
  
  constructor(public data: DataService, private apollo: Apollo, private route: ActivatedRoute) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
    }

    this.duration = this.data.formatVideoDuration(this.video.duration);
    this.channelID = 1;
    this.channelName = "";
    this.channelIcon = "";
    this.views = this.video.views;
    this.publishDate = "";
    this.addSave = false;
    this.formatPublishDate();
    this.getChannelByID();
    // this.checkUser();
  }
  
  checkUser(){
    if(window.location.pathname.toString().includes("/channel") && 
    this.route.routeConfig.path == "videos"){
      this.isUser = true;
    }
  }

  doAct(word: string){
    if(word == "change"){
      this.act.emit({idx: this.idx, cond: "change"});
    }else if(word == "delete"){
      this.act.emit({idx: this.idx, cond: "delete"});
    }else if(word == "edit"){
      this.act.emit({idx: this.idx, cond: "edit"});
    }else if(word == "save"){
      this.act.emit({idx: this.idx, cond: "save", id: this.video.id});
    }
    this.toggleAddSave();
  }
  
  formatPublishDate(){
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    // console.log("hour: " + hours + " video: " + this.video.hours);
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

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

  toggleAddSave(){
    this.addSave = !this.addSave;
  }
  
  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
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
      this.channelID = this.channel.id;
      this.channelName = this.channel.name;
      this.channelIcon = this.channel.icon_path;
    })
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
