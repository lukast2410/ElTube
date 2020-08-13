import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import gql from 'graphql-tag';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss']
})
export class PlaylistComponent implements OnInit, OnChanges {
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

  GET_ACTIVITY = gql `
    query CheckActivity($cond: String!, $to: String!, $from: String!){
      checkActivity(cond: $cond, to: $to, from: $from){
        to
        from
        tipe
      }
    } `

  GET_CHANNEL = gql `
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
  `


  playlist;
  channel;

  subscribed: boolean;
  playlistID;
  dataJson;
  playlistVideos = [];
  videosTemp = [];
  videos = [];

  //playlist
  playlistName: string;
  playlistDesc: string;
  playlistVis: string;
  editPlaylistName: boolean;
  editPlaylistDesc: boolean;
  selectVis: number = 1;

  //user
  users = [];
  user = null;
  loggedIn: boolean = false;
  isUser: boolean = false;
  
  //scroll
  lastKey: number;
  observer: any;

  //activity
    actProgress: boolean = true;
    
  //pop up
  myPlaylists = [];
  editedVideoId: any;
  editedPlaylistIdx: number;
  savePlaylist: boolean;
  myPlaylistName: string = "";
  showCreatePlaylist: boolean;

  constructor(private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router,
    public data: DataService) {
    this.route.params.subscribe(params => {
      // console.log(this.route.parent.snapshot.paramMap.get('name'));
      this.playlistID = this.route.snapshot.paramMap.get('id');
      console.log(this.playlistID);
      // console.log(this.channelLink);
      if(localStorage.getItem('users') == null){
        this.users = [];
      }
      else{
        this.getUserFromStorage();
        this.getMyPlaylist();
      }
      this.getOnePlaylist();
    })
   }

  ngOnInit(): void {
    this.subscribed = false;
    this.playlistName = "";
    this.playlistDesc = "";
    this.editPlaylistName = false;
    this.editPlaylistDesc = false;
    this.savePlaylist = false;
    this.showCreatePlaylist = false;

    this.lastKey = 8;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector("#playlist-video-container");
        for(let i: number = 0; i< 6; i++){
          if(this.lastKey < this.videos.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-playlist-list");
            div.setAttribute("class", "playlist-videos");
            v.setAttribute("vid", "this.videos[this.lastKey]");
            v.setAttribute("playlist", "this.playlist");
            div.appendChild(v);
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });

    this.observer.observe(document.querySelector(".footer-scroll"));
  }
  
  ngOnChanges(): void {
  }
  
  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  toggleShowSort(){
    let sort = document.getElementById("sort-container").style;
    if(sort.display == "none" || sort.display == ""){
      sort.display = "block";
    }else{
      sort.display = "none";
    }
  }

  toggleEditPlaylistName(word: string){
    this.editPlaylistName = !this.editPlaylistName;
    if(word != 'save'){
      this.playlistName = this.playlist.name;
    }
  }

  toggleEditPlaylistDesc(word: string){
    this.editPlaylistDesc = !this.editPlaylistDesc;
    if(word != 'save'){
      this.playlistDesc = this.playlist.description;
    }
  }

  saveEditPlaylist(word: string){
    if(word == "name"){
      if(this.playlistName.length == 0 || this.playlistName == this.playlist.name){
        this.toggleEditPlaylistName('cancel');
        return;
      }
      this.toggleEditPlaylistName('save');
      this.updatePlaylist();
    }else if(word == "desc"){
      if(this.playlistDesc == this.playlist.description){
        this.toggleEditPlaylistDesc('cancel');
        return;
      }
      this.toggleEditPlaylistDesc('save');
      this.updatePlaylist();
    }
  }

  changePrivacy(value){
    this.playlistVis = value.toString();
    this.updatePlaylist();
  }

  sortPlaylistVideos(word: string){
    if(word == "views"){
      this.videos.sort((a, b) => (parseInt(a.views) > parseInt(b.views)) ? -1 : 1);
    }else if(word == "added-newest"){
      this.videos.sort((a, b) => (a.date_added > b.date_added) ? -1 : 1);
    }else if(word == "added-oldest"){
      this.videos.sort((a, b) => (a.date_added > b.date_added) ? 1 : -1);
    }else if(word == "publish-newest"){
      this.videos.sort((a, b) => (new Date(a.year, a.month-1, a.day) > new Date(b.year, b.month-1, b.day)) ? -1 : 1);
    }else if(word == "publish-oldest"){
      this.videos.sort((a, b) => (new Date(a.year, a.month-1, a.day) > new Date(b.year, b.month-1, b.day)) ? 1 : -1);
    }
    this.playlistVideos = [];
      this.videos.forEach(element => {
        let temp = {
          id: element.id,
          day: element.date_added.getDate(),
          month: element.date_added.getMonth()+1,
          year: element.date_added.getFullYear(),
        }
        this.playlistVideos.push(temp);
      });
      this.dataJson.video = this.playlistVideos;
      this.updatePlaylist();
  }
  
  subscribeChannel(){
    if(this.user != null){
      this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "channel", this.channel.id);
    }
  }

  checkActivity(to: string, from: string, cond: string, table: string, id: number){
    if(this.actProgress){
      this.actProgress = false;
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
  }

  afterCheckActivity(obj: any, cond: string, table: string, id: number){
    if(cond == "channel"){
      if(obj.tipe == "Subscribed"){
        console.log("Found you have subscribe it table : " + table);
        if(table == "channel"){
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
        if(table == "channel"){
          this.createActivity(cond, this.channel.id, this.user.id, "Subscribed");
          this.doActivity(table, this.channel.id, 1);
          this.subscribed = true;
        }else{
          console.log("check");
          this.subscribed = false;
          this.actProgress = true;
        }
      }
    }
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
        , variables:{
          link: this.channel.channel_link,
        }
      }]
    }).subscribe(result => {
      console.log("activity done: " + table + " added " + doing);
      this.actProgress = true;
    })
  }

  randomVideos(){
    if(this.playlistVideos.length > 0){
      let random = Math.floor(Math.random() * this.playlistVideos.length)
      this.router.navigate(['/watch', this.playlistVideos[random].id, {playlist: this.playlist.id}]);
    }
  }

  removeAllVideos(){
    this.dataJson.video = [];
    this.updatePlaylist();
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
        id: this.playlistID,
      }
    }).valueChanges.subscribe(result => {
      this.playlist = result.data.getOnePlaylist;
      this.playlistName = this.playlist.name;
      this.playlistDesc = this.playlist.description;
      this.dataJson = JSON.parse(this.playlist.video_list);
      this.playlistVis = this.playlist.visibility;
      this.playlistVideos = this.dataJson.video;
      this.getOneChannel();
      if(this.user && this.user.id == this.playlist.user_id){
        this.isUser = true;
      }
      if(this.playlist.visibility == "private"){
        this.selectVis = 0;
      }else{
        this.selectVis = 1;
      }
      this.videos = [];
      console.log(this.playlistVideos);
      if(this.playlistVideos.length > 0){
        this.playlistVideos.forEach(element => {
          this.getVideo(element.id, new Date(element.year, element.month - 1, element.day))
        })
      }
    }, (error) => {
      this.router.navigate(['/home']);
    })
  }
  
  updatePlaylist(){
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
        id: this.playlist.id,
        day: new Date().getDate(),
        month: (new Date().getMonth()+1),
        year: new Date().getFullYear(),
        name: this.playlistName,
        views: this.playlist.views,
        description: this.playlistDesc,
        visibility: this.playlistVis,
        user_id: this.playlist.user_id,
        video_list: JSON.stringify(this.dataJson),
      },
      refetchQueries:[{
        query: this.GET_ONE_PLAYLIST
        , variables:{
          id: this.playlistID,
        }
      }]
    }).subscribe(result => {
      console.log("success update playlists");
    })
  }

  deletePlaylist(){
    this.apollo.mutate({
      mutation: gql `
        mutation DeletePlaylist($id: ID!){
          deletePlaylist(id: $id)
        }
      `,
      variables:{
        id: this.playlist.id,
      },
      refetchQueries:[{
        query: this.GET_PLAYLISTS
        ,variables:{
          user_id: this.user.id,
        }
      }]
    }).subscribe(result => {
      this.router.navigate(['/home']);
    })
  }
  
  getVideo(id, date){
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
      vi.date_added = date;
      this.videos.push(vi);
      console.log(this.videos);
    })
  }
  
  getOneChannel(){
    this.apollo.query<any>({
      query: gql `
        query GetOneChannelByUser($user_id: Int!){
          getOneChannelByUser(user_id: $user_id){
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
        user_id: this.playlist.user_id,
      }
    }).subscribe(result => {
      this.channel = result.data.getOneChannelByUser;
      if(this.user != null){
        this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "check", this.channel.id);
      }
    },(error)=>{
      //gaada channel
    })
  }
  
  //pop up
  actFromBox(event){
    this.editedVideoId = event.id;
    if(event.cond == "save"){
      this.toggleSavePlaylist();
    }else if(event.cond == "remove"){
      console.log("removing");
      let data = JSON.parse(this.playlist.video_list);
      var removeIndex = data.video.map(function(item) { return item.id; }).indexOf(this.editedVideoId);
      data.video.splice(removeIndex, 1);
      this.dataJson = data;
      this.updatePlaylist();
    }
  }
  
  checkPlaylistList(pl): boolean{
    var data = JSON.parse(pl.video_list);
    var found = data.video.map(function(item) { return item.id; }).indexOf(this.editedVideoId);
    return found == -1? false : true;
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
    let data = JSON.parse(this.myPlaylists[this.editedPlaylistIdx].video_list);
    let json = {
      id: this.editedVideoId,
      day: new Date().getDate(),
      month: (new Date().getMonth() + 1),
      year: new Date().getFullYear()
    };
    if(event.target.checked){
      data.video.push(json);
      this.updateMyPlaylist(JSON.stringify(data));
    }else{
      var removeIndex = data.video.map(function(item) { return item.id; }).indexOf(this.editedVideoId);
      data.video.splice(removeIndex, 1);
      this.updateMyPlaylist(JSON.stringify(data));
    }
  }

  validateCreatePlaylist(){
    if(this.myPlaylistName == ""){
      document.getElementById("playlist-name").style.borderBottom = "solid red 2px";
      return;
    }else{
      let playlistVis = (<HTMLInputElement>document.getElementById("select-playlist-privacy")).value;
      let json = { video: [{
        id: this.editedVideoId,
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
      this.myPlaylists = result.data.getMyPlaylist;
      // let data = JSON.parse(this.myPlaylists[0].video_list);
      // console.log(data);  
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
      this.myPlaylistName = "";
    })
  }

  updateMyPlaylist(json){
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
        id: this.myPlaylists[this.editedPlaylistIdx].id,
        day: new Date().getDate(),
        month: (new Date().getMonth()+1),
        year: new Date().getFullYear(),
        name: this.myPlaylists[this.editedPlaylistIdx].name,
        views: this.myPlaylists[this.editedPlaylistIdx].views,
        description: this.myPlaylists[this.editedPlaylistIdx].description,
        visibility: this.myPlaylists[this.editedPlaylistIdx].visibility,
        user_id: this.myPlaylists[this.editedPlaylistIdx].user_id,
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
