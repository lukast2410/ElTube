import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../../services/data.service';
import { AngularFireUploadTask, AngularFireStorage } from 'angularfire2/storage';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-channel-community',
  templateUrl: './channel-community.component.html',
  styleUrls: ['./channel-community.component.scss']
})
export class ChannelCommunityComponent implements OnInit {
  GET_POSTS = gql `
    query GetAllPost($channel_id: Int!){
      getAllPost(channel_id: $channel_id){
        id
        channel_id
        picture_path
        content
        like
        dislike
        day
        month
        year
        hours
        minutes
        seconds
      }
    }      
  `

  //channel
  channelLink: string;
  channel;

  //user
  users = [];
  user = null;
  loggedIn: boolean = false;
  
  create: boolean;

  //scroll
  lastKey: number;
  observer: any;

  //post
  posts = [];
  picPath: string = "";
  postContent: string = "";
  thumbnailTask: AngularFireUploadTask;
  thumbnailSnap: Observable<any>;
  thumbnailPercentage: Observable<number>;
  thumbnailUploaded: boolean;
  thumbnailName: string;
  thumbnailDownloadURL: string;

  constructor(private storage: AngularFireStorage, private apollo: Apollo, private route: ActivatedRoute, private router: Router,
    public data: DataService) {
    this.route.params.subscribe(params => {
      // console.log(this.route.parent.snapshot.paramMap.get('name'));
      this.channelLink = this.route.parent.snapshot.paramMap.get('name');
      // console.log(this.channelLink);
      this.getChannelByLink();
    })
   }

   ngOnInit(): void {
     if(localStorage.getItem('users') == null){
       this.users = [];
     }
     else{
       this.getUserFromStorage();
     }
     
    this.create = false;
    let postForm = document.getElementById('create-post-form').style;
    postForm.display = "none";

    this.lastKey = 6;
    this.observer = new IntersectionObserver((entry)=>{
      if(entry[0].isIntersecting){
        let container = document.querySelector("#channel-community-container");
        for(let i: number = 0; i< 4; i++){
          if(this.lastKey < this.posts.length){
            console.log(this.lastKey);
            let div = document.createElement("div");
            let v = document.createElement("app-community-post");
            div.setAttribute("class", "channel-posts");
            v.setAttribute("vid", "this.posts[this.lastKey]");
            v.setAttribute("channel", "this.channel");
            div.appendChild(v);
            container.appendChild(div);
            this.lastKey++;
          }
        }
      }
    });
    this.observer.observe(document.querySelector(".footer-scroll"));
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  toggleCreate(){
    this.create = !this.create;
    let postForm = document.getElementById('create-post-form').style;
    if(this.create) postForm.display = "block";
    else postForm.display = "none";
  }

  validatePost(){
    this.postContent = (<HTMLInputElement>document.getElementById("content-form")).value;
    if(this.postContent.length == 0){
      (<HTMLInputElement>document.getElementById("content-form")).placeholder = "Please input the content";
    }else{
      this.createPost();
      this.toggleCreate();
      (<HTMLInputElement>document.getElementById("content-form")).value = "";
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

  uploadThumbnail(drop: File){
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
          })

        );
        
      }else{
        console.log("not image type");
        return;
      }
    }
  }
  
  formatSizeUnits(bytes) {
    var marker = 1024; // Change to 1000 if required
    var decimal = 2; // Change as required
    var kiloBytes = marker; // One Kilobyte is 1024 bytes
    var megaBytes = marker * marker; // One MB is 1024 KB
    var gigaBytes = marker * marker * marker; // One GB is 1024 MB

    // return bytes if less than a KB
    if(bytes < (kiloBytes - (24 * bytes))) return bytes + " Bytes";
    // return KB if less than a MB
    else if(bytes < (megaBytes - (24 * kiloBytes))) return(bytes / kiloBytes).toFixed(decimal) + " KB";
    // return MB if less than a GB
    else if(bytes < (gigaBytes - (24 * megaBytes))) return(bytes / megaBytes).toFixed(decimal) + " MB";
    // return GB if less than a TB
    else return(bytes / gigaBytes).toFixed(decimal) + " GB";
  }

  formatPercentage(pct){
    return pct.toFixed(1);
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
      this.getAllPost();
      console.log("channel user id: " + this.channel.user_id + " user id: " + this.user.id);
    })
  }

  getAllPost(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetAllPost($channel_id: Int!){
          getAllPost(channel_id: $channel_id){
            id
            channel_id
            picture_path
            content
            like
            dislike
            day
            month
            year
            hours
            minutes
            seconds
          }
        }      
      `,
      variables:{
        channel_id: this.channel.id,
      }
    }).valueChanges.subscribe(result => {
      this.posts = result.data.getAllPost;
      console.log(result.data.getAllPost);
    })
  }

  createPost(){
    this.apollo.mutate({
      mutation: gql `
        mutation CreatePost($channel_id: Int!, $picture_path: String!, $like: Int!, $dislike: Int!,
          $content: String!, $day: Int!, $month: Int!, $year: Int!, $hours: Int!, $minutes: Int!, 
          $seconds: Int!){
          createPost(input: {
            channel_id: $channel_id,
            picture_path: $picture_path,
            like: $like,
            dislike: $dislike,
            content: $content,
            day: $day,
            month: $month,
            year: $year,
            hours: $hours,
            minutes: $minutes,
            seconds: $seconds,
          }){
            id
          }
        }
      `,
      variables:{
        channel_id: this.channel.id,
        picture_path: this.picPath,
        like: 0,
        dislike: 0,
        content: this.postContent,
        day: new Date().getDate(),
        month: (new Date().getMonth() + 1),
        year: new Date().getFullYear(),
        hours: new Date().getHours(),
        minutes: new Date().getMinutes(),
        seconds: new Date().getSeconds()
      },
      refetchQueries:[{
        query: this.GET_POSTS
        ,variables:{
          channel_id: this.channel.id,
        }
      }]
    }).subscribe(result => {
      console.log("create post success");
      this.picPath = "";
    })
  }

}
