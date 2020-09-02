import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../services/data.service';
import { KeyObject } from 'crypto';

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.scss']
})
export class WatchComponent implements OnInit, OnChanges {

  constructor(private route: ActivatedRoute, private apollo: Apollo, public data: DataService,
    public router: Router) { 
      this.route.params.subscribe(params => {
        // console.log(params);
        this.id = this.route.snapshot.paramMap.get("id");
        this.playlistId = this.route.snapshot.paramMap.get("playlist");
        if(localStorage.getItem('users') == null){
          this.users = [];
          this.location = "Indonesia";
          this.premium = "false";
        }
        else{
          this.getUserFromStorage();
        }
        this.isAddedToQueue = false;
        this.queueVideos = [];
        this.playlistVideos = [];
        this.getOneVideo();
        if(this.playlistId != null){
          this.viewPlaylist();
          this.getOnePlaylist();
        }
      })
    }
  
  id;
  videoUrl: string;
  video;
  views: number;
  pause: boolean;
  mute: boolean;
  volumeVal: number;
  timestamp: string;
  fullscreen: boolean;
  visibility: string;
  location: string;
  premium: string;
  
  //user
  users = [];
  user = null;
  loggedIn = false;

  //passing
  videos = [];

  //channel
  channel;
  channelName: string;
  channelSubs: string;
  channelIcon: string;
  publishDate: string;
  subscribed: boolean;

  //scroll
  lastKey: number;
  indexComment: number;
  observer: any;

  //activity
  res;
  like: boolean;
  dislike: boolean;
  subscribe: boolean;
  actProgress: boolean;
  subsProgress: boolean;
  array = [1,2,3,4,5];

  //comment
  showSort: boolean = false;
  inputComment: string = "";
  comments = [];

  //queue autoplay
  autoplay: boolean = true;
  showQueue: boolean = true;
  isAddedToQueue: boolean = false;

  //playlist
  playlistId;
  playlist;
  dataJson;
  playlistVideoList = [];
  playlistVideos = [];
  queues = [];
  queueVideos = [];

  GET_QUEUE = gql `
    query GetMyQueue($user_id: Int!){
      getMyQueue(user_id: $user_id){
        id
        user_id
        video_id
      }
    }
  `

  GET_COMMENT = gql `
    query GetComment($video_id: Int!){
      getComment(video_id: $video_id){
        id
        user_id
        video_id
        like
        dislike
        day
        month
        year
        hours
        minutes
        seconds
        comment_id
        content
      }
    }
  `

  GET_ONE_PLAYLIST = gql `
    query GetOnePlaylist($id: ID!){
      getOnePlaylist(id: $id){
        id
        day
        month
        year
        name
        views
        description
        visibility
        user_id
        video_list
      }
    }
  `

  GET_ACTIVITY = gql `
    query CheckActivity($cond: String!, $to: String!, $from: String!){
      checkActivity(cond: $cond, to: $to, from: $from){
        to
        from
        tipe
      }
    } `

  GET_VIDEO = gql `
  query GetVideo($id: ID!){
    getVideo(id: $id){
      id
      channel_id
      title
      description
      views
      like
      dislike
      comment
      visibility
      restrict
      day
      month
      year
      video_path
      thumbnail_path
      category
      location
      premium
      duration  
    }
  } `

  GET_CHANNEL = gql `
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
  `
  
  ngOnInit(): void {

    this.visibility = "public";
    this.videoUrl = "";
    this.views = 0;
    this.pause = true;
    this.mute = false;
    this.timestamp = "00:00 / 00:00"
    this.fullscreen = false;
    this.channelName = "";
    this.channelSubs = "";
    this.channelIcon = "";
    this.publishDate = "";
    this.subscribed = false;
    this.like = false;
    this.dislike = false;
    this.actProgress = true;
    this.subsProgress = true;
    this.javaScriptVideo();

    this.lastKey = 8;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector("#watch-page-right");
        for(let i: number = 0; i< 6; i++){
          if(this.lastKey < this.videos.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-related-video");
            div.setAttribute("class", "related-videos");
            v.setAttribute("vid", "this.videos[this.lastKey]");
            div.appendChild(v);
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });

    this.observer.observe(document.querySelector(".footer-scroll"));

    this.indexComment = 8;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector("#watch-comment-container");
        for(let i: number = 0; i< 6; i++){
          if(this.indexComment < this.comments.length){
            // console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-comment");
            div.setAttribute("class", "video-comments");
            v.setAttribute("comment", "this.comments[this.indexComment]");
            div.appendChild(v);
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });

    this.observer.observe(document.querySelector(".comment-scroll"));
  }

  ngOnChanges(): void {

  }

  javaScriptVideo(){
    var watch = document.querySelector(".watch-video") as HTMLVideoElement;
    var volume = document.getElementById("volume-slider") as HTMLInputElement;
    var progress = document.getElementById("progress-video");
    var progressBar = document.getElementById("progress-bar");
    watch.play();
    this.pause = false;
    watch.volume = 1;
    this.volumeVal = 1;
    volume.value = "100";
    watch.addEventListener('timeupdate', () => {
      var pos = watch.currentTime / watch.duration * 100;
      progress.style.flexBasis = `${pos}%`;
      this.timestamp = this.data.formatVideoDuration(Math.floor(watch.currentTime)) + " / " +
      this.data.formatVideoDuration(Math.floor(watch.duration));
      if(watch.ended){
        if(this.playlistVideos.length != 0){
          var videoIndex = this.playlistVideos.map(function(item) { return item.id; }).indexOf(this.video.id);
          if(videoIndex < 0){
            this.router.navigate(['/home']);
          }else if(videoIndex == this.playlistVideos.length - 1){
            if(this.queueVideos.length != 0){
              this.router.navigate(['/watch', this.queueVideos[0].id]);
              watch.currentTime = 0;
              watch.play();
            }else if(this.autoplay){
              this.router.navigate(['/watch', this.videos[0].id]);
              watch.currentTime = 0;
              watch.play();
            }else if(!this.autoplay){
              watch.pause();
              this.pause = true;
            }
          }else{
            this.router.navigate(['/watch', this.playlistVideos[videoIndex+1].id, {playlist: this.playlist.id}]);
            watch.currentTime = 0;
            watch.play();
          }
        }else if(this.playlistVideos.length == 0){
          if(this.queueVideos.length != 0){
            var videoIndex = this.queueVideos.map(function(item) { return item.id; }).indexOf(this.video.id);
            if(videoIndex < 0){
              this.router.navigate(['/home']);
            }else if(videoIndex == this.queueVideos.length - 1){
              if(!this.isAddedToQueue){
                let idx = this.queues.map(function(item) { return item.video_id.toString(); }).indexOf(this.video.id);
                if(idx >= 0){
                  this.deleteQueue(this.queues[idx].id);
                }
              }
              if(this.autoplay){
                this.router.navigate(['/watch', this.videos[0].id]);
                watch.currentTime = 0;
                watch.play();
              }else if(!this.autoplay){
                watch.pause();
                this.pause = true;
              }
            }else{
              let idx = this.queues.map(function(item) { return item.video_id.toString(); }).indexOf(this.video.id);
              if(idx >= 0){
                this.deleteQueue(this.queues[idx].id);
              }
              this.router.navigate(['/watch', this.queueVideos[videoIndex+1].id]);
              watch.currentTime = 0;
              watch.play();
            }
          }else if(this.autoplay){
            this.router.navigate(['/watch', this.videos[0].id]);
            watch.currentTime = 0;
            watch.play();
          }else if(!this.autoplay){
            watch.pause();
            this.pause = true;
          }
        }

      }
    })

    watch.addEventListener("mousedown", (e) => {
      if( e.which == 3 ){

      }else if( e.button == 2){

      }
    })

    watch.addEventListener('click', () => {
      console.log(this.pause);
      if(watch.paused || this.pause == true){
        this.pause = false;
        watch.play();
      }else{
        this.pause = true;
        watch.pause();
      }
    })

    volume.addEventListener('change', () => {
      watch.volume = parseInt(volume.value)/100; 
      if(watch.volume == 0){
        this.mute = true;
      }else{
        this.mute = false;
      }
    })
    volume.addEventListener('mousemove', () => {
      watch.volume = parseInt(volume.value)/100; 
      if(watch.volume == 0){
        this.mute = true;
      }else{
        this.mute = false;
      }
    })

    progressBar.addEventListener('click', (e) => {
        console.log(e);
        const scrub = (e.offsetX / progressBar.offsetWidth) * watch.duration;
        watch.currentTime = scrub;
    })

    window.addEventListener("keydown", (key) => {
      if(key.keyCode == 70){
        this.toggleFullscreen();
      }else if(key.keyCode == 74 || key.keyCode == 37){
        watch.currentTime -= 10;
      }else if(key.keyCode == 76 || key.keyCode == 39){
        watch.currentTime += 10;
      }else if(key.keyCode == 75 || key.keyCode == 32){
        this.togglePlayPause();
      }else if(key.keyCode == 38 && watch.volume < 1){
        volume.value = (parseInt(volume.value) + 10).toString();
        watch.volume += 0.1;
      }else if(key.keyCode == 40 && watch.volume > 0){
        volume.value = (parseInt(volume.value) - 10).toString();
        watch.volume -= 0.1;
      }
    })
  }

  togglePlayPause(){
    let watch = document.querySelector(".watch-video") as HTMLVideoElement;
    console.log(this.pause);
    if(watch.paused || this.pause == true){
      this.pause = false;
      watch.play();
    }else{
      this.pause = true;
      watch.pause();
    }
  }

  toggleMute(){
    let watch = document.querySelector(".watch-video") as HTMLVideoElement;
    var volume = document.getElementById("volume-slider") as HTMLInputElement;
    if(this.mute == true){
      if(this.volumeVal == 0){
        watch.volume = 1;
        volume.value = "100";
      }else{
        watch.volume = this.volumeVal;
        volume.value = (this.volumeVal * 100).toString();
      }
      this.mute = false;
    }else{
      this.volumeVal = watch.volume;
      this.mute = true;
      watch.volume = 0;
      volume.value = "0";
    }
  }

  toggleFullscreen(){
    let watch = document.querySelector(".watch-video") as HTMLVideoElement;
    if(watch.requestFullscreen){
      watch.requestFullscreen();
      // this.fullscreen = !this.fullscreen;
      // console.log(watch.getVideoPlaybackQuality());
    }
  }

  toggleShowSort(){
    let sort = document.getElementById("sort-container").style;
    if(sort.display == "none" || sort.display == ""){
      sort.display = "block";
    }else{
      sort.display = "none";
    }
  }

  toggleAutoplay(event){
    if(event.target.checked){
      this.autoplay = true;
    }else{
      this.autoplay = false;
    }
  }

  toggleShowQueue(){
    this.showQueue = !this.showQueue;
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
    this.location = this.user.location;
    this.premium = this.user.premium.toString();
  }

  getOneVideo(){
    this.apollo.mutate({
      mutation: gql `
        mutation GetOneVideo($id: ID!){
          getOneVideo(id: $id){
            id
            views
          }
        }
      `,
      variables:{
        id: this.id,
      }
    }).subscribe(result => {
      this.getVideo();
    })
  }

  getVideo(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetVideo($id: ID!){
          getVideo(id: $id){
            id
            channel_id
            title
            description
            views
            like
            dislike
            comment
            visibility
            restrict
            day
            month
            year
            hours
            minutes
            seconds
            video_path
            thumbnail_path
            category
            location
            premium
            duration  
          }
        }
      `,
      variables:{
        id: this.id,
      }
    }).valueChanges.subscribe(result => {
      this.video = result.data.getVideo;
      this.videoUrl = this.video.video_path;
      this.views = this.video.views;
      if(this.video.like == 0){
        document.getElementById("like-animation").style.width = "0%";  
      }else{
        document.getElementById("like-animation").style.width = (this.video.like / (this.video.like + this.video.dislike)) * 50 + "%";
      }
      console.log(this.video);
      this.getMyQueue();
      this.getRelatedVideos();
      this.getComment();
      this.getChannelByID();
      if(this.user != null){
        this.checkActivity(this.video.id.toString(), this.user.id.toString(), "video", "check", this.video.id);
      }
    })
  }

  getRelatedVideos(){
    this.apollo.watchQuery<any>({
      query: gql `
        query RelatedVideos($id: ID!, $location: String!, $category: String!, $visibility: String!, $premium: String!) {
          relatedVideos(id: $id, location: $location, category: $category, visibility: $visibility, premium: $premium){
            id
            channel_id
            title
            description
            views
            like
            dislike
            comment
            visibility
            restrict
            day
            month
            year
            hours
            minutes
            seconds
            video_path
            thumbnail_path
            category
            location
            premium
            duration
          }
        }
      `,
      variables: {
        id: this.video.id,
        location: this.location,
        category: this.video.category,
        visibility: this.visibility,
        premium: this.premium.toString(),
      }
    }).valueChanges.subscribe(result => {
      this.videos = result.data.relatedVideos;
      console.log(this.videos);
    })
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
      this.channelIcon = this.channel.icon_path;
      this.channelSubs = (this.channel.subscriber - 1).toString();
      this.publishDate = this.data.formatDate(this.video);
      if(this.user != null){
        this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "check", this.channel.id);
      }
      console.log(this.channel)
    })
  }

  sortComment(word: string){
    if(word == "popular"){
      this.comments.sort((a, b) => (parseInt(a.like) > parseInt(b.like)) ? -1 : 1);
    }else if(word == "newest"){
      this.comments.sort((a, b) => (new Date(a.year, a.month-1, a.day) > new Date(b.year, b.month-1, b.day)) ? -1 : 1);
    }
  }

  likeDislikeComment(obj){
    console.log(obj.id);
    let idx = this.comments.map(function(item) { return item.id; }).indexOf(obj.id);
    if(idx >= 0){
      this.checkActivity(obj.id.toString(), this.user.id.toString(), "comment", obj.cond, parseInt(obj.id));
    }
  }

  likeDislikeVideo(word: string){
    if(this.user != null){
      if(word == "like" && this.actProgress){
        this.checkActivity(this.video.id.toString(), this.user.id.toString(), "video", "like video", this.video.id);
      }else if(word == "dislike" && this.actProgress){
        this.checkActivity(this.video.id.toString(), this.user.id.toString(), "video", "dislike video", this.video.id);
      }else if(word == "subscribe" && this.actProgress){
        this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "channel", this.channel.id);
      }
    }
  }

  checkActivity(to: string, from: string, cond: string, table: string, id: number){
      this.apollo.query<any>({
        query: gql `
          query CheckActivity($cond: String!, $to: String!, $from: String!){
            checkActivity(cond: $cond, to: $to, from: $from){
              to
              from
              tipe
            }
          }
        `,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }).subscribe(result => {
        this.afterCheckActivity(result.data.checkActivity, cond, table, id);
      })
  }

  afterCheckActivity(obj: any, cond: string, table: string, id: number){
    if(cond == "video"){
      // console.log(obj);
      if(obj.tipe == "Like Video"){
        console.log("Found you have like it table : " + table);
        if(table == "like video" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);
          this.like = false;
        }else if(table == "dislike video" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, this.video.id, this.user.id, "Dislike Video");
          this.doActivity("like video reverse", id, -1);
          this.like = false;
          this.dislike = true;
        }else{
          console.log("checking");
          this.like = true;
          this.actProgress = true;
        }
      }else if(obj.tipe == "Dislike Video"){
        console.log("Found you have dislike it : " + table)
        if(table == "like video" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, this.video.id, this.user.id, "Like Video");
          this.doActivity("like video reverse", id, 1);
          this.like = true;
          this.dislike = false;         
        }else if(table == "dislike video" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);   
          this.dislike = false;       
        }else{
          console.log("checking");
          this.dislike = true;
          this.actProgress = true;
        }
      }else if(obj.tipe == ""){
        console.log("Not found like or dislike")
        if(table == "like video" && this.actProgress){
          this.actProgress = false;
          this.createActivity(cond, this.video.id, this.user.id, "Like Video");
          this.doActivity(table, this.video.id, 1);
          this.like = true;
        }else if(table == "dislike video" && this.actProgress){
          this.actProgress = false;    
          this.createActivity(cond, this.video.id, this.user.id, "Dislike Video");
          this.doActivity(table, this.video.id, 1);
          this.dislike = true;
        }else{
          console.log("check");
          this.like = false;
          this.dislike = false;
          this.actProgress = true;
        }
      }
    } else if(cond == "channel"){
      if(obj.tipe == "Subscribed"){
        console.log("Found you have subscribe it table : " + table);
        if(table == "channel" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);
          this.subscribed = false;
        }else{
          console.log("checking");
          this.subscribed = true;
          this.actProgress = true;
        }
      }else if(obj.tipe == ""){
        console.log("Not found subscribe to this channel")
        if(table == "channel" && this.actProgress){
          this.actProgress = false;
          this.createActivity(cond, this.channel.id, this.user.id, "Subscribed");
          this.doActivity(table, this.channel.id, 1);
          this.subscribed = true;
        }else{
          console.log("check");
          this.subscribed = false;
          this.actProgress = true;
        }
      }
    }else if(cond == "comment"){
      // console.log(obj);
      if(obj.tipe == "Like Comment"){
        console.log("Found you have like it table : " + table);
        if(table == "like comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);
        }else if(table == "dislike comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, id.toString(), this.user.id, "Dislike Comment");
          this.doActivity("like reverse comment", id, -1);
        }else{
          console.log("checking");
          this.actProgress = true;
        }
      }else if(obj.tipe == "Dislike Comment"){
        console.log("Found you have dislike it : " + table)
        if(table == "like comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, id.toString(), this.user.id, "Like Comment");
          this.doActivity("like reverse comment", id, 1);    
        }else if(table == "dislike comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);      
        }else{
          console.log("checking");
          this.actProgress = true;
        }
      }else if(obj.tipe == ""){
        console.log("Not found like or dislike")
        if(table == "like comment" && this.actProgress){
          this.actProgress = false;
          this.createActivity(cond, id.toString(), this.user.id, "Like Comment");
          this.doActivity(table, id, 1);
        }else if(table == "dislike comment" && this.actProgress){
          this.actProgress = false;    
          this.createActivity(cond, id.toString(), this.user.id, "Dislike Comment");
          this.doActivity(table, id, 1);
        }else{
          console.log("check");
          this.actProgress = true;
        }
      }
    }
    console.log(this.subscribed);
  }

  createActivity(cond: string, to: string, from: string, tipe: string){
    this.apollo.mutate({
      mutation: gql `
        mutation CreateActivity ($to: String!, $from: String!, $tipe: String!){
          createActivity(input: {to: $to, from: $from, tipe: $tipe}){
            to
            from
            tipe    
          }
        }
      `,
      variables:{
        to: to,
        from: from,
        tipe: tipe,
      },
      refetchQueries:[{
        query: this.GET_ACTIVITY,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }]
    }).subscribe(result => {
      console.log("created activity: " + tipe);
    })
  }

  deleteActivity(cond: string, to: string, from: string, tipe: string){
    this.apollo.mutate({
      mutation: gql `
        mutation DeleteActivity ($to: String!, $from: String!, $tipe: String!){
          deleteActivity(input: {to: $to, from: $from, tipe: $tipe})
        }
      `,
      variables:{
        to: to,
        from: from,
        tipe: tipe,
      },
      refetchQueries:[{
        query: this.GET_ACTIVITY,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }]
    }).subscribe(result => {
      console.log("deleted activity: " + tipe);
    })
  }

  doActivity(table: string, id: number, doing: number){
    if(table.includes("comment")){
      this.apollo.mutate({
        mutation: gql `
          mutation DoActivity ($table: String!, $id: ID!, $do: Int!){
            doActivity(table: $table, id: $id, do: $do)
          }
        `,
        variables:{
          table: table,
          id: id,
          do: doing,
        },
        refetchQueries:[{
          query: this.GET_COMMENT
          ,variables:{
            video_id: parseInt(this.video.id),
          }
        }]
      }).subscribe(result => {
        console.log("activity done: " + table + " added " + doing);
        console.log("comment like or dislike updated");
        this.actProgress = true;
      })
    } else if(table != "channel"){
      this.apollo.mutate({
        mutation: gql `
          mutation DoActivity ($table: String!, $id: ID!, $do: Int!){
            doActivity(table: $table, id: $id, do: $do)
          }
        `,
        variables:{
          table: table,
          id: id,
          do: doing,
        },
        refetchQueries:[{
          query: this.GET_VIDEO
          ,variables:{
            id: this.video.id,
          }
        }]
      }).subscribe(result => {
        console.log("activity done: " + table + " added " + doing);
        console.log("video like or dislike " + this.video.like);
        this.actProgress = true;
      })
    }else{
      this.apollo.mutate({
        mutation: gql `
          mutation DoActivity ($table: String!, $id: ID!, $do: Int!){
            doActivity(table: $table, id: $id, do: $do)
          }
        `,
        variables:{
          table: table,
          id: id,
          do: doing,
        },
        refetchQueries:[{
          query: this.GET_CHANNEL
          ,variables:{
            id: this.video.channel_id,
          }
        }]
      }).subscribe(result => {
        console.log("activity done: " + table + " added " + doing);
        this.actProgress = true;
      })
    }
  }

  checkSelectedQueue(index): boolean{
    if(this.playlistId != null){
      var videoIndex = this.playlistVideos.map(function(item) { return item.id; }).indexOf(this.video.id);
      if(videoIndex == index){
        return true;
      }else{
        return false;
      }
    }else{
      var videoIndex = this.queueVideos.map(function(item) { return item.id; }).indexOf(this.video.id);
      if(videoIndex == index){
        return true;
      }else{
        return false;
      }
    }
  }

  getQueueLength(): string{
    var videoIndex = this.playlistVideos.map(function(item) { return item.id; }).indexOf(this.video.id);
    if(videoIndex < 0){
      videoIndex = this.queueVideos.map(function(item) { return item.id; }).indexOf(this.video.id);
      videoIndex += this.playlistVideos.length;
    }
    return videoIndex + 1 + "/" + (this.playlistVideos.length + this.queueVideos.length);
  }

  viewPlaylist(){
    this.apollo.mutate({
      mutation: gql `
        mutation ViewPlaylist($id: ID!){
          viewPlaylist(id: $id)
        }
      `,
      variables: {
        id: this.playlistId,
      },
      refetchQueries:[{
        query: this.GET_ONE_PLAYLIST
        , variables:{
          id: this.playlistId,
        }
      }]
    }).subscribe(result => {
      // console.log("playlist view updated");
    })
  }

  getOnePlaylist(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetOnePlaylist($id: ID!){
          getOnePlaylist(id: $id){
            id
            day
            month
            year
            name
            views
            description
            visibility
            user_id
            video_list
          }
        }
      `,
      variables:{
        id: this.playlistId,
      }
    }).valueChanges.subscribe(result => {
      this.playlist = result.data.getOnePlaylist;
      this.dataJson = JSON.parse(this.playlist.video_list);
      this.playlistVideoList = this.dataJson.video;
      this.playlistVideos = [];
      // console.log(this.playlistVideos);
      this.playlistVideoList.forEach(element => {
        this.getPlaylistVideo(element.id);
      })
    })
  }
  
  getPlaylistVideo(id){
    this.apollo.query<any>({
      query: gql `
        query GetVideo($id: ID!){
          getVideo(id: $id){
            id
            channel_id
            title
            description
            views
            like
            dislike
            comment
            visibility
            restrict
            day
            month
            year
            video_path
            thumbnail_path
            category
            location
            premium
            duration  
          }
        }
      `,
      variables:{
        id: id,
      }
    }).subscribe(result => {
      let vi = result.data.getVideo;
      var videoIndex = this.playlistVideos.map(function(item) { return item.id; }).indexOf(vi.id);
      if(videoIndex == -1){
        this.playlistVideos.push(vi);
      }
    })
  }

  getMyQueue(){
    if(this.user == null){
      return;
    }
    this.apollo.watchQuery<any>({
      query: gql `
        query GetMyQueue($user_id: Int!){
          getMyQueue(user_id: $user_id){
            id
            user_id
            video_id
          }
        }
      `,
      variables:{
        user_id: this.user.id,
      }
    }).valueChanges.subscribe(result => {
      this.queues = result.data.getMyQueue;
      console.log(this.queues);
      this.queueVideos = [];
      var videoIndex = this.queues.map(function(item) { 
        return item.video_id.toString(); }).indexOf(this.video.id);
      if(this.playlistId == null && videoIndex < 0 && this.queues.length != 0){
        this.queueVideos.push(this.video);
        console.log("gaada di queue");
        this.isAddedToQueue = true;
      }
      this.queues.forEach(element => {
        this.getQueueVideo(element.video_id);
      })
    })  
  }
  
  getQueueVideo(id){
    this.apollo.query<any>({
      query: gql `
        query GetVideo($id: ID!){
          getVideo(id: $id){
            id
            channel_id
            title
            description
            views
            like
            dislike
            comment
            visibility
            restrict
            day
            month
            year
            video_path
            thumbnail_path
            category
            location
            premium
            duration  
          }
        }
      `,
      variables:{
        id: id,
      }
    }).subscribe(result => {
      let vi = result.data.getVideo;
      this.queueVideos.push(vi);
      console.log(this.queueVideos);
    })
  }

  deleteOneQueue(index){
    if(this.isAddedToQueue){
      index--;
    }
    index -= this.playlistVideos.length;
    this.deleteQueue(this.queues[index].id);
  }

  deleteQueue(id){
    this.apollo.mutate({
      mutation: gql `
        mutation DeleteQueue($id: ID!){
          deleteQueue(id: $id)
        }
      `,
      variables:{
        id: id,
      },
      refetchQueries:[{
        query: this.GET_QUEUE
        , variables:{
          user_id: this.user.id,
        }
      }]
    }).subscribe(result => {
      console.log("queue deleted");
    })
  }

  showComment(c): boolean{
    if(c.comment_id != 0){
      return false;
      this.indexComment += 1;
    }else{
      return true;
    }
  }

  createComment(){
    if(this.inputComment == ""){
      return;
    }
    this.apollo.mutate({
      mutation: gql `
        mutation CreateComment($user_id: Int!, $video_id: Int!, $like: Int!, $dislike: Int!, $day: Int!,
          $month: Int!, $year: Int!, $hours: Int!, $minutes: Int!, $seconds: Int!, $comment_id: Int!, 
          $content: String!){
          createComment(input: {
            user_id: $user_id,
            video_id: $video_id,
            like: $like,
            dislike: $dislike,
            day: $day,
            month: $month,
            year: $year,
            hours: $hours,
            minutes: $minutes,
            seconds: $seconds,
            comment_id: $comment_id,
            content: $content,
          }){
            id
            user_id
            video_id
            like
            dislike
            day
            month
            year
            hours
            minutes
            seconds
            comment_id
            content
          }
        }
      `,
      variables:{
        user_id: this.user.id,
        video_id: this.video.id,
        like: 0,
        dislike: 0,
        day: new Date().getDate(),
        month: (new Date().getMonth() + 1),
        year: new Date().getFullYear(),
        hours: new Date().getHours(),
        minutes: new Date().getMinutes(),
        seconds: new Date().getSeconds(),
        comment_id: 0,
        content: this.inputComment,
      },
      refetchQueries:[{
        query: this.GET_COMMENT
        ,variables:{
          video_id: this.video.id
        }
      }]
    }).subscribe(result => {
      this.inputComment = "";
      console.log("create comment successfull");
    })
  }

  getComment(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetComment($video_id: Int!){
          getComment(video_id: $video_id){
            id
            user_id
            video_id
            like
            dislike
            day
            month
            year
            hours
            minutes
            seconds
            comment_id
            content
          }
        }
      `,
      variables:{
        video_id: this.video.id,
      }
    }).valueChanges.subscribe(result => {
      this.comments = result.data.getComment;
    })
  }
}
