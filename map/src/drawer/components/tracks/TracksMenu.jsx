import React, {useState, useContext, useEffect} from 'react';
import {Typography, ListItemText, Collapse, MenuItem, ListItemIcon, LinearProgress, Button} from "@mui/material";
import {DirectionsWalk, ExpandLess, ExpandMore} from '@mui/icons-material';
import AppContext, {toHHMMSS} from "../../../context/AppContext"
import CloudTrackGroup from "./CloudTrackGroup";
import VisibleTrackGroup from "./VisibleTrackGroup";
import LocalTrackGroup from "./LocalTrackGroup";


export default function TracksMenu() {

    const ctx = useContext(AppContext);

    const [gpxFiles, setGpxFiles] = useState([]);
    const [tracksGroupsOpen, setTracksGroupsOpen] = useState(false);
    const [tracksGroups, setTracksGroups] = useState([]);
    const [visibleTracks, setVisibleTracks] = useState({localClient: [], files: []});

    function visibleTracksOpen() {
        return visibleTracks.localClient.length > 0 || visibleTracks.files.length > 0;
    }

    //get gpx files and create groups
    useEffect(() => {
        let files = (!ctx.listFiles || !ctx.listFiles.uniqueFiles ? [] :
            ctx.listFiles.uniqueFiles).filter((item) => {
            return (item.type === 'gpx' || item.type === 'GPX')
                && (item.name.slice(-4) === '.gpx' || item.name.slice(-4) === '.GPX');
        });
        files.forEach(f => {
            f.folder = f.name.includes('/') ? f.name.split('/')[0] : 'Tracks';
        });
        setGpxFiles(files);

        files.forEach(f => {
            let group = tracksGroups.find(g => {
                return g.name === f.folder;
            })
            if (group) {
                group.files.push(f);
            } else {
                tracksGroups.push({name: f.folder, files: [f]});
            }
        });

        if (tracksGroups.length > 0) {
            let defGroup = tracksGroups.find(g => {
                return g.name === 'Tracks';
            })
            if (defGroup) {
                tracksGroups.splice(tracksGroups.indexOf(defGroup), 1);
                tracksGroups.unshift(defGroup);
            }
        }
        ctx.gpxFiles.trackGroups = tracksGroups;
        setTracksGroups(tracksGroups);

    }, [ctx.listFiles, ctx.setListFiles]);


    useEffect(() => {
        if (ctx.gpxFiles) {
            visibleTracks.files = [];
            Object.values(ctx.gpxFiles).forEach((f) => {
                if (f.url) {
                    visibleTracks.files.push(f);
                }
            })
        }
        setVisibleTracks({...visibleTracks});
    }, [ctx.gpxFiles, ctx.setGpxFiles]);

    useEffect(() => {
        if (ctx.localTracks) {
            visibleTracks.localClient = [];
            ctx.localTracks.forEach(t => {
                if (t.selected) {
                    visibleTracks.localClient.push(t)
                }
            })
        }
        setVisibleTracks({...visibleTracks});
    }, [ctx.localTracks, ctx.setLocalTracks]);


    useEffect(() => {
        let resultText = '';
        let dist = 0;
        let tracks = 0;
        let seg = 0;
        let wpts = 0;
        let time = 0;
        let diffUp = 0;
        let diffDown = 0;
        Object.values(ctx.gpxFiles).forEach((item) => {
            if (item.local !== true && item.analysis && item.url) {
                if (item.analysis.totalTracks) {
                    tracks += item.analysis.totalTracks;
                }
                if (item.analysis.points) {
                    seg += item.analysis.points - 1;
                }
                if (item.analysis.wptPoints) {
                    wpts += item.analysis.wptPoints;
                }
                if (item.analysis.totalDistance) {
                    dist += item.analysis.totalDistance;
                }
                if (item.analysis.timeMoving) {
                    time += item.analysis.timeMoving;
                }
                if (item.analysis.diffElevationUp) {
                    diffUp += item.analysis.diffElevationUp;
                }
                if (item.analysis.diffElevationDown) {
                    diffDown += item.analysis.diffElevationDown;
                }
            }

            if (item.local === true && item.analysis && item.url) {
                if (item.analysis.totalTracks) {
                    tracks += item.analysis.totalTracks;
                }
                if (item.analysis.wptPoints) {
                    wpts += item.analysis.wptPoints;
                }
                if (item.analysis.totalDistance) {
                    dist += item.analysis.totalDistance;
                }
            }
        });

        Object.values(ctx.localTracks).forEach((item) => {
            if (item.selected) {
                tracks++;
                if (item.points?.length > 0) {
                    dist += item.points[item.points.length - 1].distance;
                    seg += item.points.length - 1;
                }
            }
        });

        if (tracks > 0) {
            let segInfo = seg > 0 ? `: ${seg} segments` : ``;
            let distInfo = dist > 0 ? `, ${(dist / 1000.0).toFixed(1)} km.` : ``;
            let wptInfo = wpts > 0 ? `, ${wpts} wpts.` : ``;
            let timeInfo = time > 0 ? ` Time moving: ${toHHMMSS(time)}.` : ``;
            let uphillDownhillInfo = diffUp > 0 || diffDown ? ` Uphill / Downhill: ${(diffUp).toFixed(0)} / ${(diffDown).toFixed(0)} m.` : ``;

            resultText = `Selected ${tracks} Tracks${segInfo}${distInfo}${wptInfo}${timeInfo}${uphillDownhillInfo}`;
        }

        ctx.setHeaderText(prevState => ({
            ...prevState,
            tracks: {text: resultText}
        }));

    }, [visibleTracks, setVisibleTracks]);


    return <>
        <MenuItem sx={{mb: 1}} onClick={() => setTracksGroupsOpen(!tracksGroupsOpen)}>
            <ListItemIcon>
                <DirectionsWalk fontSize="small"/>
            </ListItemIcon>
            <ListItemText> Tracks </ListItemText>
            <Typography variant="body2" color="textSecondary">
                {gpxFiles.length > 0 ? `${gpxFiles.length}` : ''}
            </Typography>
            {gpxFiles.length === 0 ? <></> : tracksGroupsOpen ? <ExpandLess/> : <ExpandMore/>}
        </MenuItem>
        {ctx.gpxLoading ? <LinearProgress/> : <></>}
        <Collapse in={tracksGroupsOpen} timeout="auto" unmountOnExit>
            {visibleTracksOpen() && <VisibleTrackGroup visibleTracks={visibleTracks}/>}
            <LocalTrackGroup/>
            {tracksGroups && tracksGroups.map((group, index) => {
                return <CloudTrackGroup key={group + index}
                                        index={index}
                                        group={group}/>;
            })}
        </Collapse>
    </>;

}
