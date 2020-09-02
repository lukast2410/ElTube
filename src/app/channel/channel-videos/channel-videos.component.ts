import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../../services/data.service';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-channel-videos',
  templateUrl: './channel-videos.component.html',
  styleUrls: ['./channel-videos.component.scss']
})
export class ChannelVideosComponent implements OnInit {
  GET_VIDEOS = gql `
    query GetChannelVideos($channel_id: Int!){
      getChannelVideos(channel_id: $channel_id){
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
  `

  GET_PLAYLISTS = gql `
    query GetMyPlaylist($user_id: Int!){
      getMyPlaylist(user_id: $user_id){
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

  channelLink: string;
  channel;

  videos = [];
  playlists = [];

  lastKey: number;
  observer: any;
  
  //user
  users = [];
  user = null;
  loggedIn: boolean = false;
  isUser: boolean;

  //pop up
  changePrivacy: boolean;
  editVideo: boolean;
  videoDesc: string;
  videoTitle: string;
  videoPrivacy: string;
  editedVideoIdx: number;
  editedPlaylistIdx: number;
  savePlaylist: boolean;
  playlistName: string = "";
  showCreatePlaylist: boolean;

  selectVis: number;

  //drag and drop
  thumbnailTask: AngularFireUploadTask;
  thumbnailSnap: Observable<any>;
  thumbnailPercentage: Observable<number>;
  isHovering: boolean;
  thumbnailUploaded: boolean;
  thumbnailName: string;
  thumbnailDownloadURL: string;
  thumbnailPath: string;
  uploadDone: boolean;

  constructor(private storage: AngularFireStorage, private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router,
    public data: DataService) {
    this.route.params.subscribe(params => {
      // console.log(this.route.parent.snapshot.paramMap.get('name'));
      this.channelLink = this.route.parent.snapshot.paramMap.get('name');
      // console.log(this.channelLink);
      if(localStorage.getItem('users') == null){
        this.users = [];
      }
      else{
        this.getUserFromStorage();
      }
      this.getChannelByLink();
      this.getMyPlaylist();
    })
   }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
    }
    
    let sort = document.getElementById("sort-container").style;
    sort.display = "none";
    this.changePrivacy = false;
    this.editVideo = false;
    this.savePlaylist = false;
    this.thumbnailUploaded = false;
    this.thumbnailPath = "";
    this.uploadDone = true;
    this.showCreatePlaylist = false;

    this.lastKey = 8;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector(".section-videos");
        for(let i: number = 0; i< 4; i++){
          if(this.lastKey < this.videos.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-video-box");
            div.setAttribute("class", "video-box-container");
            v.setAttribute("vid", "this.videos[this.lastKey]");
            v.setAttribute("isUser", "this.isUser");
            v.setAttribute("act", "this.actFromBox($event)");
            div.appendChild(v);
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });
    this.observer.observe(document.querySelector(".footer-scroll"));
    // this.getChannelByLink();
  }

  actFromBox(event){
    this.editedVideoIdx = event.idx;
    this.videoDesc = this.videos[event.idx].description;
    this.videoTitle = this.videos[event.idx].title;
    this.videoPrivacy = this.videos[event.idx].visibility;
    this.thumbnailPath = this.videos[this.editedVideoIdx].thumbnail_path;
    if(event.cond == "delete"){
      this.deleteOneVideo(this.videos[this.editedVideoIdx].id);
    }else if(event.cond == "edit"){
      this.toggleEditVideo();
    }else if(event.cond == "change"){
      this.toggleChangePrivacy();
      if(this.videoPrivacy == "private"){
        this.selectVis = 0;
      }else{
        this.selectVis = 1;
      }
    }else if(event.cond == "save"){
      this.toggleSavePlaylist();
    }
  }

  toggleChangePrivacy(){
    this.changePrivacy = !this.changePrivacy;
  }

  showSort(){
    let sort = document.getElementById("sort-container").style;
    if(sort.display == "none"){
      sort.display = "block";
    }else{
      sort.display = "none";
    }
  }

  sortVideos(sortBy: string){
    if(sortBy == "popular"){
      this.videos.sort((a, b) => (parseInt(a.views) > parseInt(b.views)) ? -1 : 1)
    }else if(sortBy == "oldest"){
      this.videos.sort((a, b) => (new Date(a.year, a.month-1, a.day) > new Date(b.year, b.month-1, b.day)) ? 1 : -1);
    }else if(sortBy == "newest"){
      this.videos.sort((a, b) => (new Date(a.year, a.month-1, a.day) > new Date(b.year, b.month-1, b.day)) ? -1 : 1);
    }
  }

  showVideo(v): boolean{
    if(this.isUser){
      return true;
    }else{
      if(v.visibility == "public"){
        return true;
      }else{
        this.lastKey++;
        return false;
      }
    }
  }

  validateChangePrivacy(){
    let input = (<HTMLInputElement>document.getElementById("select-privacy"));
    this.videoPrivacy = input.value;
    if(this.videos[this.editedVideoIdx].visibility != this.videoPrivacy){
      this.updateVideo();
    }
  }
  
  toggleHover(event: boolean){
    this.isHovering = event;
  }

  uploadThumbnail(drop: File){
    if (drop != null){
      console.log("dropped");

      const file = drop[0];
      console.log(file);
      console.log(file.name);
      if(this.validateThumbnail(file.name)){
        this.uploadDone = false;
        this.thumbnailName = ("thumbnail");
        const path = `thumbnail/${new Date().getTime()}_${this.thumbnailName}`;
        const ref = this.storage.ref(path);

        this.thumbnailTask = this.storage.upload(path, file);

        this.thumbnailPercentage = this.thumbnailTask.percentageChanges();
        this.thumbnailSnap = this.thumbnailTask.snapshotChanges().pipe(
          tap(console.log),

          finalize( async() => {
            this.thumbnailDownloadURL = await ref.getDownloadURL().toPromise(); 
            this.thumbnailUploaded = true;
            this.thumbnailPath = this.thumbnailDownloadURL + this.thumbnailName;
            this.uploadDone = true;
          })

        );
      }else{
        console.log("not image type");
        return;
      }
    }
  }
  
  formatPercentage(pct){
    return pct.toFixed(1);
  }
  
  validateThumbnail(name: string): boolean {
    const ext = name.substring(name.lastIndexOf('.') + 1);
    if (ext.toLowerCase() == 'jpg') {
        return true;
    }
    else if (ext.toLowerCase() == 'jpeg') {
      return true;
    }
    else if (ext.toLowerCase() == 'png') {
      return true;
    }
    else if (ext.toLowerCase() == 'tif') {
      return true;
    }
    else if (ext.toLowerCase() == 'gif') {
      return true;
    }
    else {
        return false;
    }
  }

  getChannelByLink(){
    this.apollo.watchQuery<any>({
      query: gql `
        query getChannelByLink($link: String!){
          getOneChannelByLink(link: $link){
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
        link: this.channelLink,
      }
    }).valueChanges.subscribe(result => {
      console.log("get video for channel videos")
      this.channel = result.data.getOneChannelByLink;
      if(this.user && this.user.id == this.channel.user_id){
        this.isUser = true;
      }
      this.getChannelVideos();
    })
  }

  getChannelVideos(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetChannelVideos($channel_id: Int!){
          getChannelVideos(channel_id: $channel_id){
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
        channel_id: this.channel.id,
      }
    }).valueChanges.subscribe(result => {
      this.videos = result.data.getChannelVideos;
      // this.shuffle(this.randomVideos);
    })
  }

  deleteOneVideo(id: number){
    this.apollo.mutate({
      mutation: gql `
        mutation DeleteVideo($id: ID!){
          deleteVideo(id: $id)
        }
      `,
      variables: {
        id: id,
      },
      refetchQueries:[{
        query: this.GET_VIDEOS
        , variables:{
          channel_id: this.channel.id,
        }
      }]
    }).subscribe(result => {
      console.log("success delete video");
    })
  }
  
  updateVideo(){
    this.apollo.mutate({
      mutation: gql `
        mutation UpdateVideo($id: ID!, $channel_id: Int!, $title: String!, $description: String!, $views: Int!,
          $like: Int!, $dislike: Int!, $comment: Int!, $visibility: String!, $restrict: String!,
          $day: Int!, $month: Int!, $year: Int!, $hours: Int!, $minutes: Int!, $seconds: Int!, $video_path: String!, 
          $thumbnail_path: String!, $category: String!, $location: String!, $premium: String!, $duration: Int!){
            updateVideo(id: $id, input:{channel_id: $channel_id, title: $title, description: $description, 
              views: $views, like: $like, dislike: $dislike, comment: $comment, visibility: $visibility, 
              restrict: $restrict, day: $day, month: $month, year: $year, hours: $hours, minutes: $minutes, seconds: $seconds,
              video_path: $video_path, thumbnail_path: $thumbnail_path, category: $category, location: $location, 
              premium: $premium, duration: $duration}){
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
        id: this.videos[this.editedVideoIdx].id,
        channel_id: this.videos[this.editedVideoIdx].channel_id,
        title: this.videoTitle,
        description: this.videoDesc,
        views: this.videos[this.editedVideoIdx].views,
        like: this.videos[this.editedVideoIdx].like,
        dislike: this.videos[this.editedVideoIdx].dislike,
        comment: this.videos[this.editedVideoIdx].comment,
        visibility: this.videoPrivacy,
        restrict: this.videos[this.editedVideoIdx].restrict,
        day: this.videos[this.editedVideoIdx].day,
        month: this.videos[this.editedVideoIdx].month,
        year: this.videos[this.editedVideoIdx].year,
        hours: this.videos[this.editedVideoIdx].hours,
        minutes: this.videos[this.editedVideoIdx].minutes,
        seconds: this.videos[this.editedVideoIdx].seconds,
        video_path: this.videos[this.editedVideoIdx].video_path,
        thumbnail_path: this.thumbnailPath,
        category: this.videos[this.editedVideoIdx].category,
        location: this.videos[this.editedVideoIdx].location,
        premium: this.videos[this.editedVideoIdx].premium,
        duration: this.videos[this.editedVideoIdx].duration,
      },
      refetchQueries:[{
        query: this.GET_VIDEOS
        ,variables:{
          channel_id: this.channel.id,
        }
      }]
    }).subscribe(result => {
      console.log("update success");
    },(error)=>{
      console.log(error);
    })
  }

  //pop up playlist need:
  checkPlaylistList(pl): boolean{
    var data = JSON.parse(pl.video_list);
    var found = data.video.map(function(item) { return item.id; }).indexOf(this.videos[this.editedVideoIdx].id);
    return found == -1? false : true;
  }

  toggleEditVideo(){
    this.editVideo = !this.editVideo;
  }

  toggleSavePlaylist(){
    if(this.user == null){
      return;
    }
    this.savePlaylist = !this.savePlaylist;
    this.showCreatePlaylist = false;
  }

  toggleShowCreatePlaylist(){
    this.showCreatePlaylist = !this.showCreatePlaylist;  
  }

  saveToPlaylist(event){
    this.showCreatePlaylist = false;
    this.editedPlaylistIdx = event.target.value;
    let data = JSON.parse(this.playlists[this.editedPlaylistIdx].video_list);
    let json = {
      id: this.videos[this.editedVideoIdx].id,
      day: new Date().getDate(),
      month: (new Date().getMonth() + 1),
      year: new Date().getFullYear()
    };
    if(event.target.checked){
      data.video.push(json);
      this.updatePlaylist(JSON.stringify(data));
    }else{
      var removeIndex = data.video.map(function(item) { return item.id; }).indexOf(this.videos[this.editedVideoIdx].id);
      data.video.splice(removeIndex, 1);
      this.updatePlaylist(JSON.stringify(data));
    }
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }
  
  validateEditVideo(){
    if(this.videoTitle == ""){
      document.getElementById("input-title").style.border = "solid red 1px";
    }else if(!this.uploadDone){
      return;
    }else{
      console.log(this.videos[this.editedVideoIdx]);
      this.updateVideo();
      this.toggleEditVideo();
    }
  }

  validateCreatePlaylist(){
    if(this.playlistName == ""){
      document.getElementById("playlist-name").style.borderBottom = "solid red 2px";
      return;
    }else{
      let playlistVis = (<HTMLInputElement>document.getElementById("select-playlist-privacy")).value;
      let json = { video: [{
        id: this.videos[this.editedVideoIdx].id,
        day: new Date().getDate(),
        month: (new Date().getMonth() + 1),
        year: new Date().getFullYear()
      }]};
      this.createPlaylist(playlistVis.toString(), JSON.stringify(json));
      this.toggleSavePlaylist();
    }
  }

  getMyPlaylist(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetMyPlaylist($user_id: Int!){
          getMyPlaylist(user_id: $user_id){
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
        user_id: this.user.id
      }
    }).valueChanges.subscribe(result => {
      this.playlists = result.data.getMyPlaylist;
      let data = JSON.parse(this.playlists[0].video_list);
      console.log(data);  
    })
  }

  createPlaylist(visibility, json){
    this.apollo.mutate({
      mutation: gql `
        mutation CreatePlaylist($user_id: Int!, $name: String!, $views: Int!, $description: String!, $day: Int!, 
          $month: Int!, $year: Int!, $visibility: String!, $video_list: String!){
          createPlaylist(input: {
            user_id: $user_id,
            name: $name,
            views: $views,
            description: $description,
            day: $day,
            month: $month,
            year: $year,
            visibility: $visibility,
            video_list: $video_list
          }){
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
        day: new Date().getDate(),
        month: (new Date().getMonth()+1),
        year: new Date().getFullYear(),
        name: this.playlistName,
        views: 0,
        description: "",
        visibility: visibility,
        user_id: this.user.id,
        video_list: json,
      },
      refetchQueries:[{
        query: this.GET_PLAYLISTS
        , variables:{
          user_id: this.user.id
        }
      }]
    }).subscribe(result => {
      console.log(result.data);
      this.playlistName = "";
    })
  }

  updatePlaylist(json){
    this.apollo.mutate({
      mutation: gql `
        mutation UpdatePlaylist($id: ID!, $user_id: Int!, $name: String!, $views: Int!, $description: String!, 
          $day: Int!, $month: Int!, $year: Int!, $visibility: String!, $video_list: String!){
          updatePlaylist(id: $id, input: {
            user_id: $user_id,
            name: $name,
            views: $views,
            description: $description,
            day: $day,
            month: $month,
            year: $year,
            visibility: $visibility,
            video_list: $video_list
          }){
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
        id: this.playlists[this.editedPlaylistIdx].id,
        day: new Date().getDate(),
        month: (new Date().getMonth()+1),
        year: new Date().getFullYear(),
        name: this.playlists[this.editedPlaylistIdx].name,
        views: this.playlists[this.editedPlaylistIdx].views,
        description: this.playlists[this.editedPlaylistIdx].description,
        visibility: this.playlists[this.editedPlaylistIdx].visibility,
        user_id: this.playlists[this.editedPlaylistIdx].user_id,
        video_list: json,
      },
      refetchQueries:[{
        query: this.GET_PLAYLISTS
        , variables:{
          user_id: this.user.id
        }
      }]
    }).subscribe(result => {
      console.log("success update playlists");
    })
  }
}
