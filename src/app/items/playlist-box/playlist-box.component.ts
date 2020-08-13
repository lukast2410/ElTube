import { Component, OnInit, Input } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import gql from 'graphql-tag';

@Component({
  selector: 'app-playlist-box',
  templateUrl: './playlist-box.component.html',
  styleUrls: ['./playlist-box.component.scss']
})
export class PlaylistBoxComponent implements OnInit {
  @Input() playlist;
  dataJson;
  playlistVideos = [];
  firstVideo;

  constructor(private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router) { }

  ngOnInit(): void {
    this.dataJson = JSON.parse(this.playlist.video_list);
    this.playlistVideos = this.dataJson.video;
    this.getVideo(this.playlistVideos[0].id);
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
}
