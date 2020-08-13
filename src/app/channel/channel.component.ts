import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../services/data.service';
import { relative } from 'path';
import { AngularFireUploadTask, AngularFireStorage } from 'angularfire2/storage';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.scss']
})
export class ChannelComponent implements OnInit, OnChanges {
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

  GET_ACTIVITY = gql `
    query CheckActivity($cond: String!, $to: String!, $from: String!){
      checkActivity(cond: $cond, to: $to, from: $from){
        to
        from
        tipe
      }
    } `

  //channel
  channelLink: string;
  channel;
  channelArt: string;
  channelIcon: string;

  //upload
  picPath: string = "";
  postContent: string = "";
  thumbnailTask: AngularFireUploadTask;
  thumbnailSnap: Observable<any>;
  thumbnailPercentage: Observable<number>;
  thumbnailUploaded: boolean;
  thumbnailName: string;
  thumbnailDownloadURL: string;

  //user
  users = [];
  user = null;
  loggedIn: boolean = false;

  //subscribe
  actProgress: boolean;
  subscribed: boolean;
  channels = [];
  subsChannel = [];

  constructor(private storage: AngularFireStorage, private apollo: Apollo, private route: ActivatedRoute, private router: Router,
    public data: DataService) {
    this.route.params.subscribe(params => {
      console.log(params);
      this.channelLink = params['name'];
      // console.log(this.channelLink);
      this.getChannelByLink();
    })

    this.router.events.subscribe((event) => {
      // console.log(event['url']);
      // console.log(this.route.firstChild.routeConfig.path);
      this.toggleSelection(this.route.firstChild.routeConfig.path);
    });
   }
   
  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
    }

    this.subscribed = false;
    this.actProgress = true;
  }
        
  ngOnChanges(changes: SimpleChanges): void {
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  toggleSelectionBar(select: string){
    let anim = document.getElementById('animation').style;
    if(select == 'home' || select == ''){
      anim.transform = 'scaleX(0.17) translateX(0%)';
      this.router.navigate(['home'], {relativeTo: this.route});
    }else if(select == 'videos'){
      anim.transform = 'scaleX(0.175) translateX(98%)';
      this.router.navigate(['videos'], {relativeTo: this.route});
    }else if(select == 'playlists'){
      anim.transform = 'scaleX(0.2) translateX(181%)';
      this.router.navigate(['playlists'], {relativeTo: this.route});
    }else if(select == 'community'){
      anim.transform = 'scaleX(0.23) translateX(253%)';
      this.router.navigate(['community'], {relativeTo: this.route});
    }else if(select == 'about'){
      anim.transform = 'scaleX(0.17) translateX(487%)';
      this.router.navigate(['about'], {relativeTo: this.route});
    }
  }

  toggleSelection(select: string){
    let anim = document.getElementById('animation').style;
    if(select == 'home' || select == ''){
      anim.transform = 'scaleX(0.17) translateX(0%)';
    }else if(select == 'videos'){
      anim.transform = 'scaleX(0.175) translateX(98%)';
    }else if(select == 'playlists'){
      anim.transform = 'scaleX(0.2) translateX(181%)';
    }else if(select == 'community'){
      anim.transform = 'scaleX(0.23) translateX(253%)';
    }else if(select == 'about'){
      anim.transform = 'scaleX(0.17) translateX(487%)';
    }
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
  
  uploadThumbnail(drop: File, type: string){
    if (drop != null){
      console.log("dropped");

      const file = drop[0];
      console.log(file);
      console.log(file.name);
      if(this.validateThumbnail(file.name)){
        console.log("thumbnail");
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
            this.picPath = this.thumbnailDownloadURL + this.thumbnailName;
            if(type == "change-icon"){
              this.channelIcon = this.picPath;
              this.updateChannel();
            }else if(type == "change-art"){
              this.channelArt = this.picPath;
              this.updateChannel();
            }
          })

        );
        
      }else{
        console.log("not image type");
        return;
      }
    }
  }
  
  subscribeChannel(){
    if(this.user != null){
      this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "channel", this.channel.id);
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
      this.channel = result.data.getOneChannelByLink;
      this.channelArt = this.channel.art_path;
      this.channelIcon = this.channel.icon_path;
      if(this.user != null){
        this.checkActivity(this.channel.id.toString(), this.user.id.toString(), "channel", "check", this.channel.id);
      }
    },(error) => {
      console.log("errorrr")
      this.router.navigate(['/home']);
    })
  }
  
  updateChannel(){
    this.apollo.mutate({
      mutation: gql `
        mutation UpdateChannel($user_id: Int!, $name: String!, $description: String!, $stats: String!,
          $subscriber: Int!, $day: Int!, $month: Int!, $year: Int!, $icon_path: String!, $art_path: String!,
          $channel_link: String!){
          updateChannel(id: 1, input: {
            user_id: $user_id, 
            name: $name, 
            description: $description, 
            stats: $stats,
            subscriber: $subscriber,
            day: $day,
            month: $month,
            year: $year,
            icon_path: $icon_path
            art_path: $art_path,
            channel_link: $channel_link
          }){
            id
          }
        }
      `,
      variables:{
        user_id: this.channel.user_id, 
        name: this.channel.name, 
        description: this.channel.description, 
        stats: this.channel.stats,
        subscriber: this.channel.subscriber,
        day: this.channel.day,
        month: this.channel.month,
        year: this.channel.year,
        icon_path: this.channelIcon,
        art_path: this.channelArt,
        channel_link: this.channel.channel_link
      },
      refetchQueries:[{
        query: this.GET_CHANNEL
        , variables:{
          link: this.channelLink,
        }
      }]
    }).subscribe(result => {
      console.log("success update channel art or icon");
      this.picPath = "";
    })
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
          link: this.channelLink,
        }
      }]
    }).subscribe(result => {
      console.log("activity done: " + table + " added " + doing);
      this.actProgress = true;
    })
  }
}
