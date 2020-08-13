import { Component, OnInit, Input } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import gql from 'graphql-tag';

@Component({
  selector: 'app-playlist-search',
  templateUrl: './playlist-search.component.html',
  styleUrls: ['./playlist-search.component.scss']
})
export class PlaylistSearchComponent implements OnInit {
  @Input() playlist;
  dataJson;
  playlistVideos = [];
  firstVideo;
  channel;

  constructor(private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router) { }

  ngOnInit(): void {
    this.dataJson = JSON.parse(this.playlist.video_list);
    this.playlistVideos = this.dataJson.video;
    this.getVideo(this.playlistVideos[0].id);
    this.getOneChannel();
  }

  getVideo(id){
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
      this.firstVideo = result.data.getVideo;
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
    },(error)=>{
      //gaada channel
    })
  }
}
